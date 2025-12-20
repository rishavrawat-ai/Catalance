import bcrypt from "bcrypt";
import crypto from "crypto";
import { env } from "../../config/env.js";

const pepperPassword = (password) => {
  return crypto
    .createHmac("sha512", env.PASSWORD_PEPPER)
    .update(password)
    .digest("hex");
};

export const hashPassword = async (password) => {
  const peppered = pepperPassword(password);
  return bcrypt.hash(peppered, env.PASSWORD_SALT_ROUNDS);
};

export const verifyPassword = async (password, hash) => {
  const peppered = pepperPassword(password);
  return bcrypt.compare(peppered, hash);
};

export const verifyLegacyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
