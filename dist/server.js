"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const app_1 = __importDefault(require("./app"));
require("./config/env");
const db_1 = require("./config/db");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const message_socket_1 = require("./sockets/message.socket");
const webrtc_socket_1 = require("./sockets/webrtc.socket");
const socketAuth_1 = require("./sockets/socketAuth");
const PORT = process.env.PORT || 5000;
const httpserver = (0, http_1.createServer)(app_1.default);
exports.io = new socket_io_1.Server(httpserver, {
    cors: {
        origin: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    },
});
exports.io.use(socketAuth_1.socketAuthMiddleware);
(0, message_socket_1.setupMessageSocket)(exports.io);
(0, webrtc_socket_1.setupWebRTCSocket)(exports.io);
(0, db_1.connectDB)().then(() => {
    httpserver.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Server is running at http://0.0.0.0:${PORT}`);
    });
});
