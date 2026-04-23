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
const corsOptions = {
    origin: [
<<<<<<< HEAD
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
=======
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
>>>>>>> 49ac4a2 (Add ngrok logs and new image uploads)
    // Allow the server to receive cookies and authorization headers
    credentials: true,
    // Explicitly allow common headers used with JWT and file uploads
    allowedHeaders: [
<<<<<<< HEAD
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
    ],
    // Optional: Allows the frontend to read specific headers from the response
    exposedHeaders: ["set-cookie"],
=======
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
    ],
    // Optional: Allows the frontend to read specific headers from the response
    exposedHeaders: ['set-cookie'],
>>>>>>> 49ac4a2 (Add ngrok logs and new image uploads)
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use((0, cors_1.default)(corsOptions));
// Ensure preflight requests are handled for all routes
<<<<<<< HEAD
app.options("/{*any}", (0, cors_1.default)(corsOptions));
=======
app.options('/{*any}', (0, cors_1.default)(corsOptions));
>>>>>>> 49ac4a2 (Add ngrok logs and new image uploads)
app.use(express_1.default.json());
app.use((req, res, next) => {
    next();
});
app.use(express_1.default.static("public"));
// app.get('/', (_req, res) => {
//   res.json({ success: true, message: 'Opalmer API is running' })
// })
<<<<<<< HEAD
app.get("/health", (_req, res) => {
    res.json({
        success: true,
        message: "Opalmer API is running",
=======
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Opalmer API is running',
>>>>>>> 49ac4a2 (Add ngrok logs and new image uploads)
        uptime: process.uptime(),
    });
});
app.use("/api/v1", routes_1.default);
app.use(notFound_1.notFound);
app.use(globalErrorHandler_1.globalErrorHandler);
exports.default = app;
