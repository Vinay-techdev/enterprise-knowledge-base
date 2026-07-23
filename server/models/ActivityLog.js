import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null },
  },
  { timestamps: true }
);

activityLogSchema.index({ organization: 1, createdAt: -1 });
export default mongoose.model("ActivityLog", activityLogSchema);
