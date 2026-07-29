import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { errorHandler, notFound } from "./middlewares/error.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((item) => item.trim());

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(Object.assign(new Error("Origin is not allowed by CORS"), { statusCode: 403 }));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: "draft-8", legacyHeaders: false }));
app.use("/api/documents", rateLimit({ windowMs: 15 * 60 * 1000, limit: 200, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ success: true, message: "Enterprise Knowledge Base API is healthy", timestamp: new Date().toISOString() }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((error) => { console.error("Database connection failed:", error.message); process.exit(1); });
