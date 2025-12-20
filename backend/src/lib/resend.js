import { Resend } from "resend";
import { env } from "../config/env.js";

export const resend =
  env.RESEND_API_KEY?.trim() ? new Resend(env.RESEND_API_KEY) : null;

export const ensureResendClient = () => {
  if (!resend) {
    throw new Error(
      "Resend is not configured. Set RESEND_API_KEY in backend/.env."
    );
  }
  return resend;
};
