import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { logActivity } from "../services/activityService.js";
import { cleanText, isObjectId, isStrongPassword, isValidEmail, normalizeEmail } from "../utils/validation.js";

const orgId = (req) => req.user.organization._id;

export const listOrganizationUsers = async (req, res, next) => {
  try {
    const users = await User.find({ organization: orgId(req) }).sort({ createdAt: -1 });
    res.json({ success: true, users: users.map((user) => user.toSafeObject()) });
  } catch (error) { next(error); }
};

export const createEmployee = async (req, res, next) => {
  try {
    const name = cleanText(req.body.name);
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    const role = req.body.role || "employee";

    if (!name || !email || !password) return res.status(400).json({ success: false, message: "Name, email and password are required" });
    if (name.length < 2) return res.status(400).json({ success: false, message: "Name must contain at least 2 characters" });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Enter a valid email address" });
    if (!isStrongPassword(password)) return res.status(400).json({ success: false, message: "Password must be at least 8 characters and include a letter and number" });
    if (!["admin", "employee"].includes(role)) return res.status(400).json({ success: false, message: "Invalid role" });
    if (await User.exists({ email })) return res.status(409).json({ success: false, message: "Email is already registered" });

    const user = await User.create({ name, email, password, role, organization: orgId(req) });
    await user.populate("organization", "name slug plan");
    await logActivity({ action: "USER_CREATED", description: `${req.user.name} added ${user.name} as ${role}`, organization: orgId(req), user: req.user._id });
    res.status(201).json({ success: true, user: user.toSafeObject() });
  } catch (error) { next(error); }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid user identifier" });
    const { status } = req.body;
    if (!["active", "disabled"].includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
    if (req.params.id === req.user.id && status === "disabled") {
      return res.status(400).json({ success: false, message: "You cannot disable your own account" });
    }

    const user = await User.findOne({ _id: req.params.id, organization: orgId(req) });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const organization = await Organization.findById(orgId(req));
    if (organization?.owner?.toString() === user.id && status === "disabled") {
      return res.status(400).json({ success: false, message: "The workspace owner cannot be disabled" });
    }

    user.status = status;
    await user.save({ validateBeforeSave: false });
    await logActivity({ action: "USER_STATUS_UPDATED", description: `${req.user.name} ${status === "active" ? "enabled" : "disabled"} ${user.name}`, organization: orgId(req), user: req.user._id });
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) { next(error); }
};
