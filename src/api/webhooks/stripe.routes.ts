import { Router } from "express";
import { stripeWebhookHandler } from "./stripe.controller";

const stripeWebhookRouter = Router();

stripeWebhookRouter.post("/", stripeWebhookHandler);

export default stripeWebhookRouter;
