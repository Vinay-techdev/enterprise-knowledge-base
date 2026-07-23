import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    storageUsed: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Organization", organizationSchema);
