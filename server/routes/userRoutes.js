import { Router } from "express";
import { createEmployee, listOrganizationUsers, updateUserStatus } from "../controllers/userController.js";
import { authorize, protect } from "../middlewares/auth.js";

const router = Router();
router.use(protect, authorize("admin"));
router.get("/", listOrganizationUsers);
router.post("/", createEmployee);
router.patch("/:id/status", updateUserStatus);
export default router;
