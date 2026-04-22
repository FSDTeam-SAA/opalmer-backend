import cors from "cors";
import express from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import router from "./routes";
const app = express();

const corsOptions = {
  origin: "*",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
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
