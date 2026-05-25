import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
//import twoFARoutes from "./routes/2fa.js";
import fileRoutes from "./routes/files.js";
import serviceRequestRoutes from "./routes/serviceRequests.js";
import "./firebaseAdmin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   CORS – FIXED FOR CHECKWIZE
================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",

  // Firebase (old)
  "https://hireshield-app-e9bbd.web.app",
  "https://hireshield-app-e9bbd.firebaseapp.com",

  // CheckWize (NEW – REQUIRED)
  "https://checkwize.com",
  "https://www.checkwize.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server, Postman, mobile, etc.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed for this origin"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// IMPORTANT: preflight support
app.options("*", cors());

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());

/* ===============================
   ROUTES
================================ */
app.use("/api/auth", authRoutes);
//app.use("/api/2fa", twoFARoutes);
app.use("/api/files", fileRoutes);
app.use("/api/service-requests", serviceRequestRoutes);

/* ===============================
   HEALTH / ROOT
================================ */
app.get("/", (req, res) => {
  res.type("text/plain").send("CheckWize backend running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "CheckWize Backend",
    time: new Date().toISOString(),
  });
});

/* ===============================
   404 HANDLER
================================ */
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 CheckWize backend running on port ${PORT}`);
});
