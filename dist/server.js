"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const message_socket_1 = require("./sockets/message.socket");
const webrtc_socket_1 = require("./sockets/webrtc.socket");
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const httpserver = (0, http_1.createServer)(app_1.default);
exports.io = new socket_io_1.Server(httpserver, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
(0, message_socket_1.setupMessageSocket)(exports.io);
(0, webrtc_socket_1.setupWebRTCSocket)(exports.io);
(0, db_1.connectDB)().then(() => {
    httpserver.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
});
