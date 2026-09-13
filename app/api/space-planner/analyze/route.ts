import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getUserCredits, deductAuditCredit } from '@/lib/space-planner-credits'
import { mapProductsToAmazonAffiliate } from '@/lib/space-planner-affiliate'
import type {
    SpaceContext,
    RoomType,
    OrganizationGoal,
    BudgetTier,
    PhasedStep,
    ProductRecommendation,
} from '@/lib/space-planner-types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60s for multimodal vision + mockup generation

// -----------------------------------------------------------------------------
// PROVIDER DETECTION & CLIENT INITIALIZATION
// -----------------------------------------------------------------------------
const isGeminiAvailable = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    !process.env.GEMINI_API_KEY.includes('PLACEHOLDER')
)

const isOpenAIAvailable = Boolean(
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY.startsWith('sk-') &&
    !process.env.OPENAI_API_KEY.includes('PLACEHOLDER')
)

const openai = isOpenAIAvailable ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null
const genAI = isGeminiAvailable ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY!) : null

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase()

        // 1. Authenticate Requesting User
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // 2. Parse Body Inputs
        const body = await req.json()
        const {
            spaceContext = 'home' as SpaceContext,
            roomType = 'living_room' as RoomType,
            title,
            goals = ['organize_categorize'] as OrganizationGoal[],
            budgetTier = 'medium' as BudgetTier,
            budgetLimit,
            lifestyleMetrics = {},
            clutterPhotoUrls = [] as string[],
        } = body

        // 3. Verify Credit Balance / Free Sample Access
        const creditStatus = await getUserCredits(user.id)
        if (!creditStatus.hasCredit) {
            return NextResponse.json(
                {
                    error: 'Insufficient space planner credits. Purchase a credit package or top up to run an audit.',
                    code: 'PAYMENT_REQUIRED',
                    balance: creditStatus.balance,
                    freeSampleAvailable: creditStatus.freeSampleAvailable,
                },
                { status: 402 }
            )
        }

        // 4. Create Initial Audit Record in 'processing' State
        const isFreeSample = creditStatus.freeSampleAvailable && creditStatus.balance === 0
        const { data: audit, error: auditInsertError } = await supabase
            .from('space_audits')
            .insert({
                user_id: user.id,
                space_context: spaceContext,
                room_type: roomType,
                title: title || `${roomType.replace(/_/g, ' ').toUpperCase()} Audit`,
                goals,
                budget_tier: budgetTier,
                budget_limit: budgetLimit || null,
                lifestyle_metrics: lifestyleMetrics,
                clutter_photos: clutterPhotoUrls,
                status: 'processing',
                is_free_sample: isFreeSample,
            })
            .select()
            .single()

        if (auditInsertError || !audit) {
            console.error('Failed to create space audit record:', auditInsertError)
            return NextResponse.json(
                { error: 'Failed to initialize audit record in database' },
                { status: 500 }
            )
        }

        // 5. Execute Multimodal AI Analysis with Provider Fallback
        let aiOutput: {
            executive_summary: string
            key_pain_points: string[]
            phased_steps: PhasedStep[]
            visual_mockup_prompt: string
            suggested_products: Partial<ProductRecommendation>[]
        }

        try {
            if (isGeminiAvailable && genAI) {
                console.log('[SpacePlanner AI] Analyzing with Google Gemini...')
                aiOutput = await runGeminiAnalysis(spaceContext, roomType, goals, budgetTier, lifestyleMetrics, clutterPhotoUrls)
            } else if (isOpenAIAvailable && openai) {
                console.log('[SpacePlanner AI] Analyzing with OpenAI GPT-4o...')
                aiOutput = await runOpenAIAnalysis(spaceContext, roomType, goals, budgetTier, lifestyleMetrics, clutterPhotoUrls)
            } else {
                throw new Error('No AI provider credentials configured (OPENAI_API_KEY or GEMINI_API_KEY required).')
            }
        } catch (aiErr: any) {
            console.error('Multimodal AI generation failed:', aiErr)
            // Mark audit as failed
            await supabase
                .from('space_audits')
                .update({ status: 'failed', error_message: aiErr?.message })
                .eq('id', audit.id)

            return NextResponse.json(
                { error: `AI Analysis failed: ${aiErr?.message || 'Inference error'}` },
                { status: 500 }
            )
        }

        // 6. Generate Photorealistic Concept Mockup via DALL-E 3 (if OpenAI available)
        let visualMockupUrl: string | null = null
        if (isOpenAIAvailable && openai && aiOutput.visual_mockup_prompt) {
            try {
                console.log('[SpacePlanner AI] Synthesizing visual mockup via DALL-E 3...')
                const imageResponse = await openai.images.generate({
                    model: 'dall-e-3',
                    prompt: `Photorealistic architectural interior design photo of a beautifully decluttered and organized ${roomType.replace(/_/g, ' ')} (${spaceContext} setting). ${aiOutput.visual_mockup_prompt}. Cinematic soft daylight, wide angle 35mm lens, 8k resolution, minimalist modern aesthetic, perfectly styled shelves and neat storage containers.`,
                    n: 1,
                    size: '1024x1024',
                    quality: 'standard',
                })
                visualMockupUrl = imageResponse.data?.[0]?.url || null
            } catch (imgErr) {
                console.warn('[SpacePlanner AI] DALL-E 3 generation failed or rate limited, falling back to mockup prompt:', imgErr)
            }
        }

        // 7. Enrich & Map Amazon Affiliate Product List
        const enrichedProducts = mapProductsToAmazonAffiliate(
            spaceContext,
            roomType,
            budgetTier,
            aiOutput.suggested_products
        )

        // 8. Atomically Deduct Credit in Supabase
        const deductResult = await deductAuditCredit(user.id, audit.id)
        if (!deductResult.success) {
            console.warn('Credit deduction returned warning:', deductResult.message)
        }

        // 9. Persist Structured Results in space_audit_results
        const { data: auditResults, error: resultsError } = await supabase
            .from('space_audit_results')
            .insert({
                audit_id: audit.id,
                user_id: user.id,
                executive_summary: aiOutput.executive_summary,
                key_pain_points: aiOutput.key_pain_points,
                phased_steps: aiOutput.phased_steps,
                visual_mockup_url: visualMockupUrl,
                visual_mockup_prompt: aiOutput.visual_mockup_prompt,
                product_recommendations: enrichedProducts,
            })
            .select()
            .single()

        if (resultsError) {
            console.error('Failed to save audit results:', resultsError)
            return NextResponse.json(
                { error: 'Failed to record audit results in database' },
                { status: 500 }
            )
        }

        // 10. Mark Audit Completed
        await supabase
            .from('space_audits')
            .update({ status: 'completed' })
            .eq('id', audit.id)

        return NextResponse.json({
            success: true,
            audit: {
                ...audit,
                status: 'completed',
            },
            results: auditResults,
            creditsRemaining: deductResult.balance,
            usedFreeSample: deductResult.usedFreeSample,
        })
    } catch (err: any) {
        console.error('Unhandled exception in /api/space-planner/analyze:', err)
        return NextResponse.json(
            { error: err?.message || 'An unexpected error occurred processing space audit' },
            { status: 500 }
        )
    }
}

// -----------------------------------------------------------------------------
// PROMPT BUILDER FOR MULTIMODAL INFERENCE
// -----------------------------------------------------------------------------
function buildContextPrompt(
    context: SpaceContext,
    roomType: RoomType,
    goals: OrganizationGoal[],
    budgetTier: BudgetTier,
    lifestyleMetrics: Record<string, any>
): string {
    const goalsFormatted = goals.map((g) => g.replace(/_/g, ' ')).join(', ')

    let contextSpecificInstructions = ''
    if (context === 'home') {
        contextSpecificInstructions = `
TRACK: HOME ENVIRONMENT
- Family Size: ${lifestyleMetrics.family_size || 'N/A'}
- Has Pets: ${lifestyleMetrics.has_pets ? 'Yes' : 'No'}
- Primary Usage: ${lifestyleMetrics.primary_usage || 'Daily living & storage'}
- Desired Aesthetic: ${lifestyleMetrics.desired_aesthetic || 'Clean functional'}
- Focus on practical sorting categories (Keep, Relocate, Donate, Trash), daily maintenance habit loops, and clear labeling for all family members.
`
    } else if (context === 'classroom') {
        contextSpecificInstructions = `
TRACK: CLASSROOM / EDUCATIONAL ENVIRONMENT
- Student Count: ${lifestyleMetrics.student_count || 'N/A'}
- Grade Level: ${lifestyleMetrics.grade_level || 'Elementary'}
- Subject Focus: ${lifestyleMetrics.subject_focus || 'General'}
- Accessibility & Sensory Needs: ${lifestyleMetrics.accessibility_needs ? 'Required' : 'Standard'}
- Focus on high-traffic student flow, rapid student transition routines, ADA accessibility clearances, non-tip storage bins, and color-coded group stations.
`
    } else if (context === 'business') {
        contextSpecificInstructions = `
TRACK: BUSINESS & COMMERCIAL ENVIRONMENT
- Employee Headcount: ${lifestyleMetrics.employee_headcount || 'N/A'}
- Foot Traffic: ${lifestyleMetrics.daily_foot_traffic || 'Moderate'}
- Compliance Requirements: ${lifestyleMetrics.compliance_requirements?.join(', ') || 'OSHA General'}
- Storage Turnover: ${lifestyleMetrics.storage_turnover_frequency || 'Weekly'}
- Focus on OSHA aisle clearance, trip-hazard prevention, heavy-duty commercial shelving specs, rapid FIFO inventory picking, and industrial SKU labeling.
`
    }

    return `
You are the Avant-Garde Enterprise SpaceIQ Expert — a world-class professional organization architect and industrial ergonomics consultant.
Analyze the user's space inputs and provided photos of clutter to generate an actionable, phased spatial transformation plan.

ROOM TYPE: ${roomType.replace(/_/g, ' ').toUpperCase()}
GOALS: ${goalsFormatted}
BUDGET TIER: ${budgetTier.toUpperCase()}
${contextSpecificInstructions}

You must return valid, parseable JSON conforming strictly to this structure:
{
  "executive_summary": "A 2-3 sentence strategic evaluation of the room layout, clutter bottlenecks, and organizational opportunity.",
  "key_pain_points": ["Specific clutter or functional issue 1", "Specific issue 2", "Specific issue 3"],
  "phased_steps": [
    {
      "phase_number": 1,
      "title": "Purge & Categorization",
      "description": "Clear all loose items and categorize by frequency of use.",
      "time_estimate_minutes": 60,
      "priority": "must_have",
      "steps": [
        {
          "step_number": 1,
          "action": "Clear all horizontal surfaces onto a staging table.",
          "zone": "Main workspace",
          "tips": "Sort into 4 distinct bins: Keep, Donate, Relocate, Trash."
        }
      ]
    },
    {
      "phase_number": 2,
      "title": "Zoning & Storage Installation",
      "description": "Establish ergonomic storage zones based on daily access patterns.",
      "time_estimate_minutes": 90,
      "priority": "must_have",
      "steps": [
        {
          "step_number": 1,
          "action": "Install vertical modular shelving units.",
          "zone": "North perimeter wall",
          "tips": "Reserve eye-level shelves for highest daily turnover items."
        }
      ]
    },
    {
      "phase_number": 3,
      "title": "Labeling & Routine Maintenance",
      "description": "Implement clear visual cues and sustainable 5-minute daily reset habits.",
      "time_estimate_minutes": 30,
      "priority": "recommended",
      "steps": [
        {
          "step_number": 1,
          "action": "Apply bold uniform labels to all bins and shelf faces.",
          "zone": "All storage containers",
          "tips": "Ensures every user immediately knows where items belong."
        }
      ]
    }
  ],
  "visual_mockup_prompt": "A detailed 1-2 sentence interior design prompt for generating an image of the finished, organized space with optimal lighting and container aesthetics.",
  "suggested_products": [
    {
      "title": "Product name matching organizational need",
      "category": "Category name",
      "price_estimate": 29.99,
      "priority": "must_have",
      "placement_zone": "Specific zone in the room",
      "reasoning": "Why this specific organizer solves the clutter problem."
    }
  ]
}
`
}

// -----------------------------------------------------------------------------
// OPENAI GPT-4O RUNNER
// -----------------------------------------------------------------------------
async function runOpenAIAnalysis(
    context: SpaceContext,
    roomType: RoomType,
    goals: OrganizationGoal[],
    budgetTier: BudgetTier,
    lifestyleMetrics: Record<string, any>,
    photoUrls: string[]
) {
    if (!openai) throw new Error('OpenAI client not initialized')

    const prompt = buildContextPrompt(context, roomType, goals, budgetTier, lifestyleMetrics)

    // Build user content (text + optional photos)
    const content: any[] = [{ type: 'text', text: prompt }]

    for (const url of photoUrls) {
        if (url && (url.startsWith('http') || url.startsWith('data:image/'))) {
            content.push({
                type: 'image_url',
                image_url: {
                    url,
                    detail: 'high',
                },
            })
        }
    }

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        temperature: 0.7,
        messages: [
            {
                role: 'system',
                content: 'You are an expert organizational space planner. Always respond with valid JSON matching the requested schema exactly.',
            },
            {
                role: 'user',
                content,
            },
        ],
    })

    const rawText = response.choices[0]?.message?.content || '{}'
    return JSON.parse(rawText)
}

// -----------------------------------------------------------------------------
// GOOGLE GEMINI RUNNER (AUTO-FALLBACK)
// -----------------------------------------------------------------------------
async function runGeminiAnalysis(
    context: SpaceContext,
    roomType: RoomType,
    goals: OrganizationGoal[],
    budgetTier: BudgetTier,
    lifestyleMetrics: Record<string, any>,
    photoUrls: string[]
) {
    if (!genAI) throw new Error('Google Generative AI client not initialized')

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
        },
    })

    const prompt = buildContextPrompt(context, roomType, goals, budgetTier, lifestyleMetrics)
    const parts: any[] = [{ text: prompt }]

    // Add images if base64 encoded
    for (const url of photoUrls) {
        if (url.startsWith('data:image/')) {
            const matches = url.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/)
            if (matches) {
                parts.push({
                    inlineData: {
                        mimeType: matches[1],
                        data: matches[2],
                    },
                })
            }
        }
    }

    const result = await model.generateContent(parts)
    const responseText = result.response.text() || '{}'
    return JSON.parse(responseText)
}
