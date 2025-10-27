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

          io.to(user.id).emit("subscription_changed");
          console.log(
            "✅ Emitted 'subscription_changed' for new subscription:",
            user.id
          );
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          if (!user) throw new Error("User not found for subscription update.");

          // Ensure a valid date is always provided to the database.
          const periodEnd =
            typeof subscription.current_period_end === "number"
              ? new Date(subscription.current_period_end * 1000)
              : undefined;

          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              stripePriceId: subscription.items.data[0].price.id,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              ...(periodEnd && { stripeCurrentPeriodEnd: periodEnd }),
            },
          });

          if (subscription.cancel_at_period_end) {
            io.to(user.id).emit("subscription_changed", { status: "canceled" });
            console.log(
              "✅ Emitted 'subscription_changed' for canceled subscription:",
              user.id
            );
          } else {
            io.to(user.id).emit("subscription_changed", { status: "updated" });
            console.log(
              "✅ Emitted 'subscription_changed' for updated subscription:",
              user.id
            );
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          if (!user)
            throw new Error("User not found for subscription deletion.");

          // Handle subscription deletion by removing the record from our database.
          await prisma.subscription.deleteMany({
            where: { stripeSubscriptionId: subscription.id },
          });

          io.to(user.id).emit("subscription_changed", { status: "deleted" });
          console.log(
            "✅ Emitted 'subscription_changed' for deleted subscription:",
            user.id
          );
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
