import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { addPurchasedCredits } from '@/lib/space-planner-credits'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const signature = req.headers.get('stripe-signature')

        let event: Stripe.Event

        // 1. Verify Event Signature
        if (webhookSecret && signature) {
            try {
                event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
            } catch (err: any) {
                console.error(`⚠️ Stripe Webhook signature verification failed: ${err.message}`)
                return NextResponse.json({ error: `Webhook signature error: ${err.message}` }, { status: 400 })
            }
        } else {
            // Fallback for direct testing / mock environments
            console.warn('⚠️ STRIPE_WEBHOOK_SECRET not set; parsing raw JSON body without signature verification')
            event = JSON.parse(body) as Stripe.Event
        }

        // 2. Handle Event Types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session

                const app = session.metadata?.app
                const userId = session.metadata?.userId
                const creditsStr = session.metadata?.credits
                const packageId = session.metadata?.packageId

                if (app === 'space-planner' && userId && creditsStr) {
                    const credits = parseInt(creditsStr, 10)
                    console.log(`[Stripe Webhook] Crediting user ${userId} with ${credits} credits from session ${session.id}`)

                    await addPurchasedCredits(userId, credits, session.id, {
                        packageId,
                        amountTotal: session.amount_total,
                        currency: session.currency,
                        customerEmail: session.customer_email || session.customer_details?.email,
                    })
                }
                break
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error('Unhandled exception in Stripe webhook:', err)
        return NextResponse.json(
            { error: err?.message || 'Webhook processing failed' },
            { status: 500 }
        )
    }
}
