import { Router } from "express";
import { BillingController } from "./billing.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const billingController = new BillingController();
const billingRouter = Router();

billingRouter.get("/plans", billingController.getPlans);

// Protected endpoint to create a Stripe Checkout session.
billingRouter.post(
  "/create-checkout-session",
  isAuthenticated,
  billingController.createCheckoutSession
);

billingRouter.get(
  "/subscription",
  isAuthenticated,
  billingController.getSubscription
);

billingRouter.post(
  "/customer-portal",
  isAuthenticated,
  billingController.createCustomerPortalSession
);

export default billingRouter;
