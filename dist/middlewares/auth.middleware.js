"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeTypes = exports.authorizeRoles = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const user_model_1 = require("../models/user.model");
// ✅ Protect route (JWT authentication)
const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Token not found");
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "default_secret");
        // Fetch user by ID from token
        const user = await user_model_1.User.findById(decoded.userId); // userId set in login token
        if (!user) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User not found");
        }
        // Attach user to request
        console.log("decoded", decoded);
        // req.user = decoded;
        req.user = user;
        next();
    }
    catch (err) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Invalid or expired token " + err);
    }
};
exports.protect = protect;
// ✅ Role-based authorization middleware
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
        }
        if (!roles.includes(req.user.role)) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Access denied. Insufficient role permissions.");
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
// ✅ Type-based authorization middleware
const authorizeTypes = (...types) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "User not authenticated");
        }
        const userTypes = req.user.type;
        const hasType = types.includes(userTypes);
        if (!hasType) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Access denied. Insufficient type permissions.");
        }
        next();
    };
};
exports.authorizeTypes = authorizeTypes;
