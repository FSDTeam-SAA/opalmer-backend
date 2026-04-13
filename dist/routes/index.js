"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_routes_1 = __importDefault(require("../routes/user.routes"));
const stuAssignToClass_routes_1 = __importDefault(require("../routes/stuAssignToClass.routes"));
const class_routes_1 = __importDefault(require("../routes/class.routes"));
const aboutAndTerm_router_1 = require("./aboutAndTerm.router");
const featuresAndQuestions_router_1 = require("./featuresAndQuestions.router");
const lesson_router_1 = __importDefault(require("./lesson.router"));
const attendance_routes_1 = __importDefault(require("./attendance.routes"));
const behavior_router_1 = __importDefault(require("./behavior.router"));
const school_router_1 = __importDefault(require("./school.router"));
const learningTip_routes_1 = __importDefault(require("./learningTip.routes"));
const message_route_1 = __importDefault(require("./message.route"));
const room_route_1 = __importDefault(require("./room.route"));
const academicDocument_router_1 = __importDefault(require("./academicDocument.router"));
const homeWork_routes_1 = require("./homeWork.routes");
const parentsChild_route_1 = __importDefault(require("./parentsChild.route"));
const quiz_routes_1 = __importDefault(require("./quiz.routes"));
const quizQA_routes_1 = __importDefault(require("./quizQA.routes"));
const quizResult_routes_1 = __importDefault(require("../routes/quizResult.routes"));
const adminDashboard_router_1 = __importDefault(require("./adminDashboard.router"));
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: '/featuresAndQuestions',
        route: featuresAndQuestions_router_1.featuresAndQuestionsRouter,
    },
    {
        path: '/aboutAndTerm',
        route: aboutAndTerm_router_1.aboutAndTermRouter,
    },
    {
        path: '/users',
        route: user_routes_1.default,
    },
    {
        path: '/student-assign-to-class',
        route: stuAssignToClass_routes_1.default,
    },
    {
        path: '/classes',
        route: class_routes_1.default,
    },
    {
        path: '/lessons',
        route: lesson_router_1.default,
    },
    {
        path: '/attendances',
        route: attendance_routes_1.default,
    },
    {
        path: '/behavior',
        route: behavior_router_1.default,
    },
    {
        path: '/school',
        route: school_router_1.default,
    },
    {
        path: '/learning-tips',
        route: learningTip_routes_1.default,
    },
    {
        path: '/message',
        route: message_route_1.default,
    },
    {
        path: '/rooms',
        route: room_route_1.default,
    },
    {
        path: '/academicDocument',
        route: academicDocument_router_1.default,
    },
    {
        path: '/homework',
        route: homeWork_routes_1.homeworkRouter,
    },
    {
        path: '/parent/child',
        route: parentsChild_route_1.default,
    },
    {
        path: '/quizzes',
        route: quiz_routes_1.default,
    },
    {
        path: '/quiz/qa',
        route: quizQA_routes_1.default,
    },
    {
        path: '/test/quizzes',
        route: quizResult_routes_1.default,
    },
    {
        path: '/dashboard',
        route: adminDashboard_router_1.default,
    }
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
