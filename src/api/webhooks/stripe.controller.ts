import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";

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
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          const subscriptionId = session.subscription as string;
          const stripeCustomerId = session.customer as string;

          if (!subscriptionId || !stripeCustomerId) {
            throw new Error(
              "Webhook Error: checkout.session.completed event is missing subscription or customer ID."
            );
          }

          const subscriptionDetails = await stripe.subscriptions.retrieve(
            subscriptionId
          );

          const user = await prisma.user.findFirst({
            where: { stripeCustomerId },
          });
          if (!user) {
            throw new Error(
              `Webhook Error: User not found for customer ID: ${stripeCustomerId}`
            );
          }

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
            },
          });
          console.log(
            "✅ checkout.session.completed: Subscription created/updated for user:",
            user.id
          );
          break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const dataToUpdate: {
            stripePriceId: string;
            stripeCurrentPeriodEnd?: Date;
          } = {
            stripePriceId: subscription.items.data[0].price.id,
          };

          if (typeof subscription.current_period_end === "number") {
            dataToUpdate.stripeCurrentPeriodEnd = new Date(
              subscription.current_period_end * 1000
            );
          }

          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: dataToUpdate,
          });

          console.log(
            `✅ ${event.type}: Subscription data updated for`,
            subscription.id
          );
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription as string;

          if (!subscriptionId) {
            console.log(
              `- Webhook Info: Invoice payment succeeded for one-time charge (ID: ${invoice.id}). No subscription to update.`
            );
            break;
          }

          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );

          await prisma.subscription.update({
            where: {
              stripeSubscriptionId: subscription.id,
            },
            data: {
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
            },
          });

          console.log(
            `✅ invoice.payment_succeeded: Subscription period updated for`,
            subscription.id
          );
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
