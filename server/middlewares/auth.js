import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    const token = req.cookies?.token || headerToken;

    if (!token) return res.status(401).json({ success: false, message: "Authentication required" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).populate("organization", "name slug plan");

    if (!user) return res.status(401).json({ success: false, message: "User no longer exists" });
    if (user.status !== "active") return res.status(403).json({ success: false, message: "Account is disabled" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "You do not have permission for this action" });
  }
  next();
};
