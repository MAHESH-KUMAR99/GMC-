import express from "express";
import {
  GetStarted,
  LoginUser,
  SendOTP,
  SaveProfile,
  SaveScore,
  GetSpinData,
  CheckLogin,
} from "../Client/Views.js";

const router = express.Router();

// ── Existing Route ──────────────────────────────
router.get("/v1/client/get-started/:useruid", GetStarted);

// ── Profile Route ──────────────────────────────
router.post("/v1/client/save-profile", SaveProfile);

router.post("/v1/client/save-score", SaveScore);

// ── OTP Routes ──────────────────────────────────
router.post("/v1/client/send-otp", SendOTP);
router.post("/v1/client/login", LoginUser);

// ── OTP Verify ──────────────────────────────────
router.post("/v1/client/verify-otp", (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res
      .status(400)
      .json({ verified: false, message: "Mobile and OTP required" });
  }

  const record = global.otpStore?.[mobile];

  if (!record) {
    return res
      .status(400)
      .json({ verified: false, message: "OTP not found, request a new one" });
  }

  if (Date.now() > record.expiresAt) {
    delete global.otpStore[mobile];
    return res
      .status(400)
      .json({ verified: false, message: "OTP expired, request a new one" });
  }

  if (record.otp !== otp.toString()) {
    return res.status(400).json({ verified: false, message: "Invalid OTP" });
  }

  delete global.otpStore[mobile];
  res.json({ verified: true, message: "OTP verified successfully" });
});

// ── Token Verify — app open hone pe ─────────────
router.post("/v1/client/verify-token", CheckLogin);

router.post("/v1/client/get/spin-data", GetSpinData);

router;

export default router;
