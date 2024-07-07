"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv").config();
const express_1 = __importDefault(require("express"));
exports.app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_1 = require("./middleware/error");
const user_route_1 = __importDefault(require("./routes/user.route"));
const course_route_1 = __importDefault(require("./routes/course.route"));
const order_route_1 = __importDefault(require("./routes/order.route"));
const notification_route_1 = __importDefault(require("./routes/notification.route"));
const analytics_route_1 = __importDefault(require("./routes/analytics.route"));
const layout_route_1 = __importDefault(require("./routes/layout.route"));
const quiz_route_1 = __importDefault(require("./routes/quiz.route"));
const express_rate_limit_1 = require("express-rate-limit");
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const express_session_1 = __importDefault(require("express-session"));
const question_route_1 = __importDefault(require("./routes/question.route"));
const result_model_1 = __importDefault(require("./routes/result.model"));
// body parser
exports.app.use(express_1.default.json({ limit: "50mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, cookie_parser_1.default)());
// cookie parser
// cors => cross origin resource sharing
exports.app.use((0, cors_1.default)({
    origin: ["http://localhost:3000"],
    credentials: true
}));
exports.app.use((0, express_session_1.default)({
    name: "Session_Id",
    saveUninitialized: true,
    resave: false,
    secret: 'some secret',
    cookie: {
        maxAge: 4 * 365 * 24 * 60 * 60 * 1000
    },
    store: connect_mongo_1.default.create({
        mongoUrl: process.env.DB_URL,
        ttl: 4 * 365 * 24 * 60 * 60 * 1000
    })
}));
// api requests limit
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
});
// routes
exports.app.use("/api/v1", user_route_1.default, order_route_1.default, course_route_1.default, notification_route_1.default, analytics_route_1.default, layout_route_1.default, quiz_route_1.default, question_route_1.default, result_model_1.default);
// unknown route
exports.app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
// middleware calls
exports.app.use(limiter);
exports.app.use(error_1.ErrorMiddleware);
