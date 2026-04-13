"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aboutAndTermRouter = void 0;
const express_1 = require("express");
const aboutAndTermController_1 = __importDefault(require("../controllers/aboutAndTermController"));
const router = (0, express_1.Router)();
router.post("/create", aboutAndTermController_1.default.createAboutAndTerm);
router.get("/about", aboutAndTermController_1.default.getAbout);
router.get("/terms", aboutAndTermController_1.default.getTerms);
router.put("/update/:id", aboutAndTermController_1.default.updateAboutAndTerm);
exports.aboutAndTermRouter = router;
