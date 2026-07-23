import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { signToken } from "../utils/token.js";
import { cleanText, isStrongPassword, isValidEmail, normalizeEmail } from "../utils/validation.js";

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/"
});

const normalizeSlug = (name) =>
  `${cleanText(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-6)}`;

export const register = async (req, res, next) => {
  let organization;
  try {
    const name = cleanText(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const organizationName = cleanText(req.body.organizationName);

    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({ success: false, message: "Name, email, password and organization name are required" });
    }
    if (name.length < 2 || organizationName.length < 2) {
      return res.status(400).json({ success: false, message: "Name and organization name must contain at least 2 characters" });
    }
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Enter a valid email address" });
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters and include a letter and number" });
    }
    if (await User.exists({ email })) return res.status(409).json({ success: false, message: "Email is already registered" });

    organization = await Organization.create({ name: organizationName, slug: normalizeSlug(organizationName) });
    const user = await User.create({ name, email, password, role: "admin", organization: organization._id });
    organization.owner = user._id;
    await organization.save();
    await user.populate("organization", "name slug plan");

    const token = signToken(user._id.toString());
    res.cookie("token", token, cookieOptions());
    res.status(201).json({ success: true, token, user: user.toSafeObject() });
  } catch (error) {
    if (organization?._id) await Organization.findByIdAndDelete(organization._id).catch(() => {});
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: "Enter a valid email address" });

    const user = await User.findOne({ email }).select("+password").populate("organization", "name slug plan");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (user.status !== "active") return res.status(403).json({ success: false, message: "Your account has been disabled. Contact a workspace admin." });

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });
    const token = signToken(user._id.toString());
    res.cookie("token", token, cookieOptions());
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (error) { next(error); }
};

export const logout = (_req, res) => {
  res.clearCookie("token", { ...cookieOptions(), maxAge: undefined });
  res.json({ success: true, message: "Logged out successfully" });
};

export const me = (req, res) => res.json({ success: true, user: req.user.toSafeObject() });
