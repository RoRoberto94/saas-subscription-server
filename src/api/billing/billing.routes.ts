import { Router } from "express";
import { BillingController } from "./billing.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated";

const billingController = new BillingController();
const billingRouter = Router();

// Protected endpoint to create a Stripe Checkout session.
billingRouter.post(
  "/create-checkout-session",
  isAuthenticated,
  billingController.createCheckoutSession
);

export default billingRouter;
