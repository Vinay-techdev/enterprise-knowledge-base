import User from "../models/User.js";
import Document from "../models/Document.js";
import ActivityLog from "../models/ActivityLog.js";
import Organization from "../models/Organization.js";

export const getDashboard = async (req, res, next) => {
  try {
    const organization = req.user.organization._id;
    const [totalUsers, activeUsers, totalDocuments, recentDocuments, recentActivity, org] = await Promise.all([
      User.countDocuments({ organization }),
      User.countDocuments({ organization, status: "active" }),
      Document.countDocuments({ organization }),
      Document.find({ organization }).populate("uploadedBy", "name").sort({ createdAt: -1 }).limit(5),
      ActivityLog.find({ organization }).populate("user", "name").sort({ createdAt: -1 }).limit(8),
      Organization.findById(organization).select("name plan storageUsed"),
    ]);
    res.json({
      success: true,
      stats: { totalUsers, activeUsers, totalDocuments, storageUsed: org?.storageUsed || 0, plan: org?.plan || "free" },
      recentDocuments,
      recentActivity,
    });
  } catch (error) { next(error); }
};
