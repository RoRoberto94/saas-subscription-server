import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Not a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
  }),
});
