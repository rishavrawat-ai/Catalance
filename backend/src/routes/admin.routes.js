import { Router } from "express";
import { getDashboardStats, getUsers, updateUserRole, updateUserStatus, getUserDetails, getProjects, getProjectDetails } from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", getDashboardStats);
router.get("/users", getUsers);
router.get("/users/:userId", getUserDetails);
router.get("/projects", getProjects);
router.get("/projects/:projectId", getProjectDetails);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/users/:userId/status", updateUserStatus);

export default router;

