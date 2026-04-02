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

// ── In-memory OTP store ───────────────────────────────────────────────────────

interface OtpRecord {
  email: string;
  otp: string;
  expiresAt: number;
}

const otpStore = new Map<number, OtpRecord>();
let otpIdCounter = 1000;

function generateOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ── Router ────────────────────────────────────────────────────────────────────

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

// ── Forgot password — send OTP ────────────────────────────────────────────────

authRouter.post("/password/forgot", (req, res) => {
  const { identifier } = req.body ?? {};
  if (!identifier || typeof identifier !== "string") {
    res.status(400).json({ ok: false, detail: "Email is required." });
    return;
  }

  const email = identifier.trim().toLowerCase();
  const user = mockUsers.find((u) => u.email === email);

  // Always respond ok to avoid user-enumeration; only send OTP if user exists
  const resetId = otpIdCounter++;
  let devOtp: string | undefined;

  if (user) {
    const otp = generateOtp();
    otpStore.set(resetId, {
      email,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });
    console.log(`[OTP] Reset OTP for ${email}: ${otp}  (reset_id=${resetId})`);
    // Return OTP in response when no real email service is configured
    if (appConfig.useInMemory) devOtp = otp;
  } else {
    otpStore.set(resetId, { email, otp: "0000", expiresAt: Date.now() });
  }

  res.json({
    ok: true,
    reset_id: resetId,
    message: "OTP generated. Check the portal for your code.",
    ...(devOtp ? { dev_otp: devOtp } : {}),
  });
});

// ── Reset password — verify OTP and set new password ─────────────────────────

authRouter.post("/password/reset", (req, res) => {
  const { reset_id, otp, new_password, confirm_password } = req.body ?? {};

  if (!reset_id || !otp || !new_password || !confirm_password) {
    res.status(400).json({ ok: false, detail: "All fields are required." });
    return;
  }
  if (new_password !== confirm_password) {
    res.status(400).json({ ok: false, detail: "Passwords do not match." });
    return;
  }
  if (typeof new_password !== "string" || new_password.length < 6) {
    res.status(400).json({ ok: false, detail: "Password must be at least 6 characters." });
    return;
  }

  const record = otpStore.get(Number(reset_id));
  if (!record) {
    res.status(400).json({ ok: false, detail: "Invalid or expired reset session." });
    return;
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(Number(reset_id));
    res.status(400).json({ ok: false, detail: "OTP has expired. Please request a new one." });
    return;
  }
  if (String(otp).trim() !== record.otp) {
    res.status(400).json({ ok: false, detail: "Incorrect OTP." });
    return;
  }

  // Update password in mockUsers
  const user = mockUsers.find((u) => u.email === record.email);
  if (user) {
    user.password = new_password;
  }

  otpStore.delete(Number(reset_id));
  console.log(`[OTP] Password reset successful for ${record.email}`);

  res.json({ ok: true, message: "Password reset successful." });
});
