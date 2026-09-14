import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabaseServer'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getUserCredits, deductAuditCredit, checkIsAdmin } from '@/lib/space-planner-credits'
import { getOrDeriveFingerprint, checkGuestMicroAuditLimit, recordGuestMicroAuditUsage } from '@/lib/space-planner-fingerprint'
import { mapProductsToAmazonAffiliate } from '@/lib/space-planner-affiliate'
import { setCachedAudit, updateCachedAuditResults } from '@/lib/space-planner-cache'
import type {
    SpaceContext,
    RoomType,
    OrganizationGoal,
    BudgetTier,
    PhasedStep,
    ProductRecommendation,
    MicroAuditSpace,
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

const ALLOWED_GUEST_MICRO_SPACES: string[] = [
    'junk_drawer',
    'cutlery_drawer',
    'desk_surface',
    'medicine_cabinet',
    'pantry_shelf',
    'under_sink',
    'entryway_table',
    'nightstand',
    'home_office', // allow quick small desk/workstation audits
]

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase()
        const adminSupabase = createAdminSupabase()

        // 1. Identify User or Guest
        const { data: { user } } = await supabase.auth.getUser()

        // 2. Parse Body Inputs
        const body = await req.json()
        const {
            spaceContext = 'home' as SpaceContext,
            roomType = 'living_room' as RoomType | MicroAuditSpace,
            title,
            goals = ['organize_categorize'] as OrganizationGoal[],
            budgetTier = 'medium' as BudgetTier,
            budgetLimit,
            lifestyleMetrics = {},
            clutterPhotoUrls = [] as string[],
            isMicroAudit = false,
        } = body

        let isAdmin = false
        let isGuest = false
        let guestFingerprint: string | null = null
        let guestIpHash: string | null = null
        let isFreeSample = false

        if (user) {
            // Check Admin Override
            isAdmin = await checkIsAdmin(user.id, user.email)

            if (!isAdmin) {
                // Verify regular user credit balance
                const creditStatus = await getUserCredits(user.id, user.email)
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
                isFreeSample = creditStatus.freeSampleAvailable && creditStatus.balance === 0
            } else {
                isFreeSample = false
            }
        } else {
            // Unauthenticated Guest Flow
            isGuest = true
            isFreeSample = true

            // Rate-limit check by IP + Browser Fingerprint
            const fpInfo = getOrDeriveFingerprint(req)
            guestFingerprint = fpInfo.fingerprint
            guestIpHash = fpInfo.ipHash

            const sampleUsedCookie = req.cookies.get('sp_sample_used')?.value === 'true'
            const { used } = await checkGuestMicroAuditLimit(guestFingerprint, guestIpHash)

            if (used || sampleUsedCookie) {
                return NextResponse.json(
                    {
                        error: "You have already used your 1 free micro-audit sample. Sign in or create an account to save plans and unlock room audits.",
                        code: 'GUEST_LIMIT_REACHED',
                    },
                    { status: 402 }
                )
            }

            // Verify micro-audit scope for guest users
            const isAllowedMicroSpace = isMicroAudit || ALLOWED_GUEST_MICRO_SPACES.includes(roomType)
            if (!isAllowedMicroSpace && spaceContext !== 'home') {
                return NextResponse.json(
                    {
                        error: "Unregistered guest audits are restricted to a single Micro-Audit (e.g. drawers, desks, or cabinets). Please select a micro-space or sign in to audit commercial or educational spaces.",
                        code: 'MICRO_AUDIT_SCOPE_REQUIRED',
                    },
                    { status: 400 }
                )
            }

            // Cap clutter photos for guests to 2 photos to prevent abuse
            if (clutterPhotoUrls.length > 2) {
                clutterPhotoUrls.splice(2)
            }
        }

        // 3. Create Initial Audit Record in 'processing' State (using privileged client)
        const auditPayload: any = {
            user_id: user ? user.id : null,
            space_context: spaceContext,
            room_type: roomType,
            title: title || (isGuest ? `Free Micro-Audit (${roomType.replace(/_/g, ' ')})` : `${roomType.replace(/_/g, ' ').toUpperCase()} Audit`),
            goals,
            budget_tier: budgetTier,
            budget_limit: budgetLimit || null,
            lifestyle_metrics: lifestyleMetrics,
            clutter_photos: clutterPhotoUrls,
            status: 'processing',
            is_free_sample: isFreeSample,
        }

        // Add guest columns if supported
        if (guestFingerprint) {
            auditPayload.guest_fingerprint = guestFingerprint
            auditPayload.is_micro_audit = true
        } else if (isMicroAudit) {
            auditPayload.is_micro_audit = true
        }

        const auditId = crypto.randomUUID()

        // Attempt database persistence (falls back to memory cache if schema unmigrated)
        let audit: any = null
        try {
            const { data, error: auditInsertError } = await adminSupabase
                .from('space_audits')
                .insert({
                    id: auditId,
                    ...auditPayload,
                })
                .select()
                .single()

            if (auditInsertError) {
                console.warn('[SpacePlanner AI] Database space_audits insert notice (using in-memory fallback):', auditInsertError.message)
            } else {
                audit = data
            }
        } catch (dbErr: any) {
            console.warn('[SpacePlanner AI] Database space_audits exception (using in-memory fallback):', dbErr?.message)
        }

        if (!audit) {
            audit = {
                id: auditId,
                ...auditPayload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        }

        // Register initial audit in server cache
        setCachedAudit(audit.id, audit, null)

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
            try {
                await adminSupabase
                    .from('space_audits')
                    .update({ status: 'failed', error_message: aiErr?.message })
                    .eq('id', audit.id)
            } catch {}
            audit.status = 'failed'
            setCachedAudit(audit.id, audit, null)

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

        // 8. Atomically Deduct Credit in Supabase (or record Guest usage)
        let deductResult = {
            success: true,
            balance: 0,
            usedFreeSample: true,
            message: 'Guest sample consumed',
        }

        if (user) {
            try {
                deductResult = await deductAuditCredit(user.id, audit.id, user.email || undefined)
            } catch (deductErr) {
                console.warn('Credit deduction skipped/failed gracefully:', deductErr)
            }
        } else if (guestFingerprint && guestIpHash) {
            // Record guest usage to prevent repeat audits
            try {
                await recordGuestMicroAuditUsage(guestFingerprint, guestIpHash, audit.id)
            } catch (guestErr) {
                console.warn('Guest usage recording skipped/failed gracefully:', guestErr)
            }
        }

        // 9. Persist Structured Results in space_audit_results (with in-memory fallback)
        let auditResults: any = null
        try {
            const { data: dbResults, error: resultsError } = await adminSupabase
                .from('space_audit_results')
                .insert({
                    audit_id: audit.id,
                    user_id: user ? user.id : null,
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
                console.warn('[SpacePlanner AI] Notice: failed to save audit results to database table (using fallback):', resultsError.message)
            } else {
                auditResults = dbResults
            }
        } catch (dbErr: any) {
            console.warn('[SpacePlanner AI] Database space_audit_results exception (using fallback):', dbErr?.message)
        }

        if (!auditResults) {
            auditResults = {
                id: crypto.randomUUID(),
                audit_id: audit.id,
                user_id: user ? user.id : null,
                executive_summary: aiOutput.executive_summary,
                key_pain_points: aiOutput.key_pain_points,
                phased_steps: aiOutput.phased_steps,
                visual_mockup_url: visualMockupUrl,
                visual_mockup_prompt: aiOutput.visual_mockup_prompt,
                product_recommendations: enrichedProducts,
                space_metrics: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        }

        // Update server cache with completed results
        updateCachedAuditResults(audit.id, auditResults)

        // 10. Mark Audit Completed in DB if available
        try {
            await adminSupabase
                .from('space_audits')
                .update({ status: 'completed' })
                .eq('id', audit.id)
        } catch {}
        audit.status = 'completed'

        const response = NextResponse.json({
            success: true,
            audit: {
                ...audit,
                status: 'completed',
            },
            results: auditResults,
            creditsRemaining: deductResult.balance,
            usedFreeSample: deductResult.usedFreeSample,
            isGuest,
            isAdmin,
        })

        // Set persistent cookie on guest browser
        if (isGuest) {
            response.cookies.set('sp_sample_used', 'true', {
                path: '/',
                maxAge: 365 * 24 * 60 * 60, // 1 year
                sameSite: 'lax',
            })
            if (guestFingerprint) {
                response.cookies.set('sp_guest_fp', guestFingerprint, {
                    path: '/',
                    maxAge: 365 * 24 * 60 * 60,
                    sameSite: 'lax',
                })
            }
        }

        return response
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
