import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'
import { stripe } from '@/lib/stripe'
import { SPACE_PLANNER_CREDIT_PACKAGES, CreditPackageId } from '@/lib/space-planner-types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase()

        // 1. Authenticate Requesting User
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        // 2. Parse Package ID
        const body = await req.json()
        const packageId: CreditPackageId = body.packageId || 'standard_3'

        const selectedPackage = SPACE_PLANNER_CREDIT_PACKAGES.find((pkg) => pkg.id === packageId)
        if (!selectedPackage) {
            return NextResponse.json({ error: `Invalid package ID: ${packageId}` }, { status: 400 })
        }

        // 3. Determine Origin for Success/Cancel Redirects
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://avantgardeenterprise.com'

        // 4. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `SpacePlan AI: ${selectedPackage.name}`,
                            description: `${selectedPackage.credits} Space Organization Credit${selectedPackage.credits > 1 ? 's' : ''} — Pay-Per-Room (No Subscription)`,
                        },
                        unit_amount: Math.round(selectedPackage.price * 100), // in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            customer_email: user.email,
            client_reference_id: user.id,
            metadata: {
                userId: user.id,
                packageId: selectedPackage.id,
                credits: selectedPackage.credits.toString(),
                app: 'space-planner',
            },
            success_url: `${origin}/tools/space-planner?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/tools/space-planner?checkout=cancelled`,
        })

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            url: session.url,
        })
    } catch (err: any) {
        console.error('Error creating Stripe checkout session:', err)
        return NextResponse.json(
            { error: err?.message || 'Failed to initialize checkout session' },
            { status: 500 }
        )
    }
}
