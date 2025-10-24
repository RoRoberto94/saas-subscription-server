import http from "http";
import { Server } from "socket.io";
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./api/auth/auth.routes";
import billingRouter from "./api/billing/billing.routes";
import stripeWebhookRouter from "./api/webhooks/stripe.routes";
import adminRouter from "./api/admin/admin.routes";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter
);

app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ message: "Server is up and running!" });
});

io.on("connection", (socket) => {
  console.log("✅ A user connected with socket ID:", socket.id);
  socket.on("join_user_room", (userId: string) => {
    socket.join(userId);
    console.log(`User with socket ID ${socket.id} joined room ${userId}`);
  });
  socket.on("disconnect", () => {
    console.log("❌ User disconnected with socket ID:", socket.id);
  });
});

app.use("/api/auth", authRouter);

app.use("/api/billing", billingRouter);

app.use("/api/admin", adminRouter);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Server with WebSockets is listening on port ${PORT}`);
  });
}

export { app, server, io };
