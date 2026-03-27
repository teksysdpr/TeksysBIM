import { Router } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { appConfig } from "../../config/env.js";
import { mockUsers } from "../../data/mock.js";
import { requireAuth } from "../../common/middleware/auth.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid login payload", errors: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const user = mockUsers.find((item) => item.email === email.toLowerCase());
  if (!user || user.password !== password) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      roles: user.roles,
      organizationId: user.organizationId,
    },
    appConfig.jwtSecret,
    { expiresIn: appConfig.jwtExpiresIn as SignOptions["expiresIn"] }
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      tokenType: "refresh",
    },
    appConfig.jwtSecret,
    { expiresIn: appConfig.refreshTokenExpiresIn as SignOptions["expiresIn"] }
  );

  res.json({
    accessToken: token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      organizationId: user.organizationId,
    },
  });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({
    user: req.user,
  });
});
