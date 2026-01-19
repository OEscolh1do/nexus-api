import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import cookieParser from "cookie-parser";
import { Logger } from "./lib/logger";

// Placeholder route imports (to be replaced as we migrate)
// import { authRoutes } from './modules/auth/auth.routes';

export const app = express();

// --- Global Middlewares ---
app.use(helmet()); // Basic security headers
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CORS_ORIGIN || "https://www.neonorte.tech",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Static Files ---
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

// --- Routes Setup ---
// --- Routes Setup ---
import { authRoutes } from "./modules/auth/auth.routes";
import { clientRoutes } from "./modules/clients/clients.routes";
import { projectRoutes } from "./modules/projects/projects.routes";
import { attachmentRoutes } from "./modules/attachments/attachments.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
// import { catalogRoutes } from './modules/catalog/catalog.routes';
import { mobileRoutes } from "./modules/mobile/mobile.routes";
import { apiLimiter } from "./middlewares/rateLimit";
import { progressiveAuthLimiter } from "./middlewares/progressiveLimit";

// --- Routes Setup ---
// Apply stricter limit to auth routes
app.use("/api/auth", progressiveAuthLimiter, authRoutes);

// Apply general limit to API
app.use("/api", apiLimiter);

app.use("/api/clients", clientRoutes);
app.use("/api", projectRoutes); // Hooks into /api/leads, /api/projects etc.
app.use("/api", attachmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
// app.use('/api/catalog', catalogRoutes); // Removed: Models deprecated
app.use("/api/mobile", mobileRoutes);

app.get("/api/status", (req, res) => {
  res.json({ status: "API rodando e segura (v2 - TS)", version: "2.0.0" });
});

// --- Generic Error Handler ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  Logger.error(`[Unhandled Error] ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: "Internal Server Error" });
});
