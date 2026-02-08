import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

if (!OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY is not set. Meal planner will not function.')
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()

        // Create Supabase client
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        // Check authentication
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError || !session) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const userId = session.user.id

        // Check quota (unless admin)
        const { data: quotaCheck } = await supabase.rpc('check_meal_planner_quota', {
            user_uuid: userId
        })

        if (!quotaCheck) {
            return NextResponse.json(
                { error: 'Monthly limit reached. Please upgrade your subscription.' },
                { status: 429 }
            )
        }

        // Parse request body
        const body = await request.json()
        const { action, ...requestData } = body

        // Call OpenAI API
        const aiResponse = await callOpenAI(action, requestData)

        // Log usage
        await supabase.from('meal_planner_usage').insert({
            user_id: userId,
            action_type: action,
            request_data: requestData,
            response_data: aiResponse,
            success: true
        })

        return NextResponse.json(aiResponse)

    } catch (error: any) {
        console.error('Meal planner API error:', error)

        // Try to log failed attempt
        try {
            const cookieStore = await cookies()
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        get(name: string) {
                            return cookieStore.get(name)?.value
                        },
                    },
                }
            )

            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                await supabase.from('meal_planner_usage').insert({
                    user_id: session.user.id,
                    action_type: 'error',
                    request_data: {},
                    response_data: { error: error.message },
                    success: false
                })
            }
        } catch (logError) {
            console.error('Failed to log error:', logError)
        }

        return NextResponse.json(
            { error: error.message || 'An error occurred processing your request' },
            { status: 500 }
        )
    }
}

async function callOpenAI(action: string, data: any) {
    let prompt = ''
    const messages: any[] = []
    const hasImages = data.fridgeImage || data.pantryImage || data.spiceImage

    if (action === 'meal_plan') {
        // Build meal plan prompt
        const { mealSchedule, dietaryPreferences, cuisinePreferences, fridgeImage, pantryImage, spiceImage } = data

        prompt = buildMealPlanPrompt(mealSchedule, dietaryPreferences, cuisinePreferences, !!fridgeImage)

        // For vision support with images
        if (hasImages) {
            const content: any[] = [{ type: 'text', text: prompt }]

            if (fridgeImage) {
                content.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${fridgeImage.mimeType};base64,${fridgeImage.data}`
                    }
                })
            }
            if (pantryImage) {
                content.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${pantryImage.mimeType};base64,${pantryImage.data}`
                    }
                })
            }
            if (spiceImage) {
                content.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${spiceImage.mimeType};base64,${spiceImage.data}`
                    }
                })
            }

            messages.push({
                role: 'user',
                content
            })
        } else {
            messages.push({
                role: 'user',
                content: prompt
            })
        }

    } else if (action === 'single_recipe' || action === 'meal_recipe') {
        const { query, servings, dietaryPreferences } = data
        prompt = buildRecipePrompt(query, servings, dietaryPreferences, action === 'meal_recipe')
        messages.push({
            role: 'user',
            content: prompt
        })
    }

    const completion = await openai.chat.completions.create({
        model: hasImages ? 'gpt-4o' : 'gpt-4o-mini', // Use vision model if images present
        messages: [
            {
                role: 'system',
                content: 'You are a professional culinary assistant. Always respond with valid JSON in the exact format requested. Be specific with measurements and clear with instructions.'
            },
            ...messages
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
    })

    const textResponse = completion.choices[0]?.message?.content

    if (!textResponse) {
        throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    try {
        return JSON.parse(textResponse)
    } catch (parseError) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || textResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Invalid response format from AI')
        }
        return JSON.parse(jsonMatch[1] || jsonMatch[0])
    }
}

function buildMealPlanPrompt(mealSchedule: any[], dietaryPreferences: string[], cuisinePreferences: string[], hasInventory: boolean): string {
    const scheduleText = mealSchedule.map(m =>
        `${m.day} ${m.mealType} (${m.servings} servings)${m.specificDish ? ` - specifically: ${m.specificDish}` : ''}`
    ).join('\n')

    const dietaryText = dietaryPreferences.length > 0 ? `\nDietary needs: ${dietaryPreferences.join(', ')}` : ''
    const cuisineText = cuisinePreferences.length > 0 ? `\nPreferred cuisines: ${cuisinePreferences.join(', ')}` : ''
    const inventoryText = hasInventory ? '\n\nI have provided images of my fridge, pantry, and spice rack. Please use these ingredients as much as possible.' : '\n\nNo inventory provided - suggest recipes with common ingredients.'

    return `You are a professional meal planning assistant. Create a detailed meal plan based on the following:

MEAL SCHEDULE:
${scheduleText}
${dietaryText}
${cuisineText}
${inventoryText}

Return your response as a JSON object with this exact structure:
{
  "meals": [
    {
      "day": "Monday",
      "mealType": "Dinner",
      "recipeName": "Recipe Name",
      "servings": 4,
      "ingredients": ["ingredient 1", "ingredient 2"],
      "instructions": ["step 1", "step 2"]
    }
  ],
  "shoppingList": ["item 1", "item 2"],
  "totalEstimatedCost": "$50-60",
  "prepTips": ["tip 1", "tip 2"]
}

Ensure all requested meals are included. Be specific with measurements in ingredients.`
}

function buildRecipePrompt(query: string, servings: number, dietaryPreferences: string[], isMeal: boolean): string {
    const typeText = isMeal ? 'complete meal' : 'single recipe'
    const dietaryText = dietaryPreferences.length > 0 ? `\nDietary requirements: ${dietaryPreferences.join(', ')}` : ''

    return `You are a professional chef. Create a detailed ${typeText} for: "${query}"

Servings: ${servings}${dietaryText}

Return your response as a JSON object with this exact structure:
{
  "recipeName": "Recipe Name",
  "servings": ${servings},
  "prepTime": "15 minutes",
  "cookTime": "30 minutes",
  "ingredients": ["ingredient 1 with measurement", "ingredient 2 with measurement"],
  "instructions": ["detailed step 1", "detailed step 2"],
  "nutritionInfo": {
    "calories": "~400 per serving",
    "protein": "25g",
    "carbs": "45g",
    "fat": "15g"
  }
}

Be specific with measurements and clear with instructions.`
}

// GET endpoint for usage stats
export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const { data: stats } = await supabase.rpc('get_meal_planner_stats', {
            user_uuid: session.user.id
        })

        return NextResponse.json(stats?.[0] || {
            total_requests: 0,
            monthly_requests: 0,
            monthly_limit: 50,
            subscription_status: 'beta_free',
            is_admin: false
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
