import { Router } from "express";
import { healthRouter } from "./health.route.js";
import { userRouter } from "./user.routes.js";
import { authRouter } from "./auth.routes.js";
import { profileRouter } from "./profile.route.js";
import { chatRouter } from "./chat.routes.js";
import { projectRouter } from "./project.routes.js";
import { proposalRouter } from "./proposal.routes.js";
import { disputeRouter } from "./dispute.routes.js";
import adminRouter from "./admin.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/proposals", proposalRouter);
apiRouter.use("/disputes", disputeRouter);
apiRouter.use("/admin", adminRouter);
