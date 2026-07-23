import ActivityLog from "../models/ActivityLog.js";

export const logActivity = async ({ action, description, organization, user, document = null }) => {
  try {
    await ActivityLog.create({ action, description, organization, user, document });
  } catch (error) {
    console.error("Activity log failed:", error.message);
  }
};
