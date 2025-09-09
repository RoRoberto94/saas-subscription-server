import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    // Verifiy webhook signature to ensure the request is from Stripe.
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.log(`❌ Error message: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const subscriptionId = session.subscription as string;
      const stripeCustomerId = session.customer as string;

      if (!subscriptionId || !stripeCustomerId) {
        console.error(
          "Webhook Error: Missing subscriptionId or customerId in checkout session."
        );
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const user = await prisma.user.findFirst({ where: { stripeCustomerId } });
      if (!user) {
        console.error(
          "Webhook Error: User not found for customer ID:",
          stripeCustomerId
        );
        break;
      }

      //Upsert the subscription to handle both creation and updates gracefully.
      await prisma.subscription.upsert({
        where: {
          userId: user.id,
        },
        update: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
        create: {
          userId: user.id,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        },
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (!subscriptionId) {
        console.log(
          "Webhook Info: Invoice payment succeeded without a subscription ID. Ignoring."
        );
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

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
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
