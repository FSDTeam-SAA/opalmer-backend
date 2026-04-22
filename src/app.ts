import cors from "cors";
import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import router from "./routes";
const app = express();

// When credentials are required, browsers reject wildcard origins (`*`).
// Reflect the request origin instead so credentials can be used safely.
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  // Allow the server to receive cookies and authorization headers
  credentials: true,
  // Explicitly allow common headers used with JWT and file uploads
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  // Optional: Allows the frontend to read specific headers from the response
  exposedHeaders: ["set-cookie"],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
// Ensure preflight requests are handled for all routes
app.options("/{*any}", cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  next();
});

app.use(express.static("public"));

// app.get('/', (_req, res) => {
//   res.json({ success: true, message: 'Opalmer API is running' })
// })
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Opalmer API is running",
    uptime: process.uptime(),
  });
});

app.use("/api/v1", router);

app.use(notFound as never);
app.use(globalErrorHandler);

export default app;
