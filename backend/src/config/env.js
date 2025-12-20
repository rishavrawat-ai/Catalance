import { config } from "dotenv";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../");
const envFileName = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
const candidatePath = resolve(projectRoot, envFileName);

if (existsSync(candidatePath)) {
  console.log("Loading .env from:", candidatePath);
  config({ path: candidatePath });
} else {
  console.log("Loading default .env");
  config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_DATABASE_URL: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  LOCAL_CORS_ORIGIN: z.string().optional(),
  VERCEL_CORS_ORIGIN: z.string().optional(),
  SOCKET_IO_PATH: z.string().default("/socket.io"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PASSWORD_PEPPER: z.string().min(16, "PASSWORD_PEPPER must be at least 16 characters"),
  PASSWORD_SALT_ROUNDS: z.coerce
    .number()
    .int()
    .min(8, "Use at least 8 bcrypt salt rounds")
    .max(15, "Avoid extremely high salt rounds in this starter")
    .default(12),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("openai/gpt-oss-20b:free"),
  OPENROUTER_MODEL_FALLBACK: z.string().default("meta-llama/llama-3.2-3b-instruct:free")
});

let env;
let envInitError = null;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Invalid or missing environment variables:", error.flatten().fieldErrors);

    if (!process.env.JWT_SECRET) {
      console.error(
        "Environment variable JWT_SECRET is missing. Set it in your hosting provider's settings (e.g. Vercel ? Project ? Settings ? Environment Variables)."
      );
    }

    if (!process.env.PASSWORD_PEPPER) {
      console.error(
        "Environment variable PASSWORD_PEPPER is missing. Set it in your hosting provider's settings (e.g. Vercel ? Project ? Settings ? Environment Variables)."
      );
    }
  }

  // Don't throw here to avoid crashing serverless function at import time.
  // Export the parsing error so the application can return a friendly 500 response
  // for incoming requests while keeping the process alive for diagnostics.
  const fallbackEnv = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT) || 5000,
    DATABASE_URL: process.env.DATABASE_URL || "",
    DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    LOCAL_CORS_ORIGIN: process.env.LOCAL_CORS_ORIGIN,
    VERCEL_CORS_ORIGIN: process.env.VERCEL_CORS_ORIGIN,
    SOCKET_IO_PATH: process.env.SOCKET_IO_PATH || "/socket.io",
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    JWT_SECRET: process.env.JWT_SECRET || "",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    PASSWORD_PEPPER: process.env.PASSWORD_PEPPER || "",
    PASSWORD_SALT_ROUNDS: Number(process.env.PASSWORD_SALT_ROUNDS) || 12,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free",
    OPENROUTER_MODEL_FALLBACK: process.env.OPENROUTER_MODEL_FALLBACK || "meta-llama/llama-3.2-3b-instruct:free"
  };

  env = fallbackEnv;
  // attach the original parse error for runtime checks
  envInitError = error;
}

export { env, envInitError };
export const isProduction = env.NODE_ENV === "production";
