import { Router } from "express";
import { StripeController } from "./stripe.controller";

const stripeWebhookRouter = Router();
const stripeController = new StripeController();

stripeWebhookRouter.post("/", (req, res) =>
  stripeController.handleWebhook(req, res)
);

export default stripeWebhookRouter;
