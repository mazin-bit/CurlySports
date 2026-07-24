"use client";

import { useState, useCallback, useRef } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

export function usePhoneAuth() {
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const sendOtp = useCallback(async (phoneNumber: string, buttonId = "send-otp-btn") => {
    setLoading(true);
    setError(null);
    try {
      // Clean up any previous verifier
      if (verifierRef.current) {
        try { verifierRef.current.clear(); } catch { /* ignore */ }
        verifierRef.current = null;
      }

      // Attach invisible reCAPTCHA directly to the send button — no separate container needed
      verifierRef.current = new RecaptchaVerifier(firebaseAuth, buttonId, {
        size: "invisible",
      });

      const result = await signInWithPhoneNumber(firebaseAuth, phoneNumber, verifierRef.current);
      setConfirmation(result);
    } catch (e: unknown) {
      let msg = "Failed to send OTP";
      if (e instanceof Error) {
        if (e.message.includes("auth/invalid-phone-number")) {
          msg = "Invalid phone number. Please include country code (e.g. +971501234567).";
        } else if (e.message.includes("auth/too-many-requests")) {
          msg = "Too many attempts. Please try again later.";
        } else if (e.message.includes("auth/quota-exceeded")) {
          msg = "SMS quota exceeded. Please try again later.";
        } else if (e.message.includes("auth/billing-not-enabled")) {
          msg = "Phone auth requires Firebase Blaze plan. Upgrade in Firebase Console.";
        } else if (e.message.includes("auth/operation-not-allowed")) {
          msg = "SMS not enabled for this region. Enable it in Firebase Console > Authentication > Settings > SMS Region Policy.";
        } else {
          msg = e.message;
        }
      }
      setError(msg);
      if (verifierRef.current) {
        try { verifierRef.current.clear(); } catch { /* ignore */ }
        verifierRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    if (!confirmation) return null;
    setLoading(true);
    setError(null);
    try {
      const credential = await confirmation.confirm(code);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Phone verification failed");
      return json;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [confirmation]);

  const reset = useCallback(() => {
    setConfirmation(null);
    setError(null);
    if (verifierRef.current) {
      try { verifierRef.current.clear(); } catch { /* ignore */ }
      verifierRef.current = null;
    }
  }, []);

  return {
    sendOtp,
    verifyOtp,
    reset,
    loading,
    error,
    codeSent: !!confirmation,
  };
}
