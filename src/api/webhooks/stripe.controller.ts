import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { io } from "../../server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export class StripeController {
  public async handleWebhook(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.log(`❌ Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Wrap event processing in a try/catch to prevent server crashes
    try {
      let stripeCustomerId: string | undefined;
      const eventObject = event.data.object as any;
      if (eventObject.customer) {
        stripeCustomerId = eventObject.customer as string;
      } else if (event.type === "customer.subscription.deleted") {
        const sub = event.data.object as Stripe.Subscription;
        stripeCustomerId = sub.customer as string;
      }

      const user = stripeCustomerId
        ? await prisma.user.findFirst({ where: { stripeCustomerId } })
        : null;

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (!user) throw new Error(`Webhook Error: User not found.`);

          const subscriptionDetails = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await prisma.subscription.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              stripeSubscriptionId: subscriptionDetails.id,
              stripePriceId: subscriptionDetails.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(
                subscriptionDetails.current_period_end * 1000
              ),
            },
            update: {
              stripePriceId: subscriptionDetails.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(
                subscriptionDetails.current_period_end * 1000
              ),
              cancelAtPeriodEnd: false,
            },
          });

          io.to(user.id).emit("subscription_success");
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          if (!user) throw new Error("User not found for subscription update.");

          // Use "upsert" to handle subscription updates gracefully, creating the record if it doesn't exist.
          await prisma.subscription.upsert({
            where: { stripeSubscriptionId: subscription.id },
            create: {
              userId: user.id,
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(
                (subscription.current_period_end ||
                  subscription.trial_end ||
                  Date.now() / 1000 + 86400) * 1000
              ),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
            update: {
              stripePriceId: subscription.items.data[0].price.id,
              ...(typeof subscription.current_period_end === "number" && {
                stripeCurrentPeriodEnd: new Date(
                  subscription.current_period_end * 1000
                ),
              }),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          });

          if (user) {
            if (subscription.cancel_at_period_end) {
              io.to(user.id).emit("subscription_canceled");
            } else {
              io.to(user.id).emit("subscription_updated");
            }
          }
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          if (!invoice.subscription) break;

          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
            },
          });
          break;
        }

        default:
          break;
      }
    } catch (error: any) {
      console.error(
        `Webhook handler error for event ${event.type}:`,
        error.message
      );
      return res.status(400).send(`Webhook handler error: ${error.message}`);
    }

    res.json({ received: true });
  }
}
