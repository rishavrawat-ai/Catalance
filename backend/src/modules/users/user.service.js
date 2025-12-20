import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { env } from "../../config/env.js";
import { ensureResendClient } from "../../lib/resend.js";
import { hashPassword, verifyPassword, verifyLegacyPassword } from "./password.utils.js";

export const listUsers = async (filters = {}) => {
  const users = await prisma.user.findMany({
    where: {
      role: filters.role
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return users.map(sanitizeUser);
};

export const createUser = async (payload) => {
  const user = await createUserRecord(payload);
  return sanitizeUser(user);
};

export const registerUser = async (payload) => {
  const user = await createUserRecord(payload);
  return {
    user: sanitizeUser(user),
    accessToken: issueAccessToken(user)
  };
};

export const authenticateUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  let isValid =
    user?.passwordHash && password
      ? await verifyPassword(password, user.passwordHash)
      : false;

  if (!isValid && user?.passwordHash && password) {
    const legacyValid = await verifyLegacyPassword(password, user.passwordHash);
    if (legacyValid) {
      isValid = true;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(password)
        }
      });
    }
  }

  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    user: sanitizeUser(user),
    accessToken: issueAccessToken(user)
  };
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sanitizeUser(user);
};

const createUserRecord = async (payload) => {
  try {
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        fullName: payload.fullName,
        passwordHash: await hashUserPassword(payload.password),
        role: payload.role ?? "FREELANCER",
        bio: payload.bio,
        skills: payload.skills ?? [],
        hourlyRate: payload.hourlyRate ?? null
      }
    });

    await maybeSendWelcomeEmail(user);

    return user;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("A user with that email already exists", 409);
    }

    throw error;
  }
};

const hashUserPassword = async (password) => {
  if (!password) {
    throw new AppError("Password is required", 400);
  }

  return hashPassword(password);
};

const maybeSendWelcomeEmail = async (user) => {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return;
  }

  try {
    const resend = ensureResendClient();
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: user.email,
      subject: "Welcome to the Freelancer platform",
      html: `<p>Hi ${user.fullName},</p><p>Thanks for joining the platform as a ${user.role.toLowerCase()}!</p>`
    });
  } catch (emailError) {
    console.warn("Unable to send welcome email via Resend:", emailError);
  }
};

export const sanitizeUser = (user) => {
  if (!user) {
    return user;
  }

  // eslint-disable-next-line no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

const issueAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN
    }
  );
};
