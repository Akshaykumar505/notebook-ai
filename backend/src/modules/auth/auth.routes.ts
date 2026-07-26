import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "@/middleware/errorHandler";
import * as authService from "./auth.service";

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1),
});

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { email, password, name } = signupSchema.parse(req.body);
    const result = await authService.signup(email, password, name);
    res.status(201).json(result);
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);
    res.json(result);
  })
);
