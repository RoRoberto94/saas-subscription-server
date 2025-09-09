import Stripe from "stripe";
import { prisma } from "../../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const plans = [
  {
    name: "Basic Plan",
    price: 10,
    priceId: "price_1S3B6h31DyGrygnKbVjGXODK",
    features: [
      "Manage up to 5 projects",
      "Basic analytics dashboard",
      "Email support",
      "10 GB of storage",
    ],
  },
  {
    name: "Pro Plan",
    price: 25,
    priceId: "price_1S3BJP31DyGrygnKzrFdMcE6",
    features: [
      "Unlimited projects",
      "Advanced analytics & reports",
      "Priority email & chat support",
      "100 GB of storage & backup",
    ],
  },
];

export class BillingService {
  getPlans() {
    return plans;
  }

  async createCheckoutSession(
    userId: string,
    priceId: string,
    clientUrl: string
  ) {
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found.");

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${clientUrl}/dashboard?payment_success=true`,
      cancel_url: `${clientUrl}/dashboard?payment_canceled=true`,
    });

    if (!session.url) throw new Error("Could not create Stripe session.");

    return { url: session.url };
  }
}
