import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRouter from "./api/auth/auth.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ message: "Server is up and running!" });
});

app.use("/api/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
