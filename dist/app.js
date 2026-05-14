"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const globalErrorHandler_1 = require("./middlewares/globalErrorHandler");
const notFound_1 = require("./middlewares/notFound");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
// When credentials are required, browsers reject wildcard origins (`*`).
// Reflect the request origin instead so credentials can be used safely.
const allowedOrigins = [
    "http://localhost:5000",
    "http://localhost:3001",
    "http://127.0.0.1:5500",
    "https://admin.classpulse.info",
];
const corsOptions = {
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps / postman)
        if (!origin)
            return callback(null, true);
        const envOrigin = process.env.CORS_ORIGIN;
        if (allowedOrigins.includes(origin) || (envOrigin && origin === envOrigin)) {
            callback(null, true);
        }
        else {
            callback(new Error("CORS not allowed"));
        }
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
    ],
    exposedHeaders: ["set-cookie"],
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
// Ensure preflight requests are handled for all routes
app.options("(.*)", (0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((req, res, next) => {
    next();
});
app.use(express_1.default.static("public"));
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
app.use("/api/v1", routes_1.default);
app.use(notFound_1.notFound);
app.use(globalErrorHandler_1.globalErrorHandler);
exports.default = app;
