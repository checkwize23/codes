import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
//import twoFARoutes from "./routes/2fa.js";
import fileRoutes from "./routes/files.js";
import serviceRequestRoutes from "./routes/serviceRequests.js";
import "./firebaseAdmin.js";

dotenv.config();

const app = express();

// CORS setup
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://hireshield-app-e9bbd.web.app",
      "https://hireshield-app-e9bbd.firebaseapp.com",
      "https://hireshield.web.app",
      "https://hireshield.firebaseapp.com",
    ];

    if (
      allowedOrigins.includes(origin) ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-requested-with",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
//app.use("/api/2fa", twoFARoutes);
app.use("/api/files", fileRoutes);
app.use("/api/service-requests", serviceRequestRoutes);

// Health endpoints
app.get(
  "/api/health",
  (req, res) =>
    res.json({
      status: "OK",
      message: "Server running",
      ts: new Date().toISOString(),
    })
);
console.log("Health check endpoint");
app.get("/api/mobile/health", (req, res) =>
  res.json({
    status: "OK",
    message: "Mobile server running",
    ts: new Date().toISOString(),
  })
);

// Preflight
app.options(/(.*)/, (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-requested-with"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

export default app;
