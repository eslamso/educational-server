"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAutheticated = void 0;
const catchAsyncErrors_1 = require("./catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// import { redis } from "../utils/redis";
const user_controller_1 = require("../controllers/user.controller");
const user_model_1 = __importDefault(require("../models/user.model"));
// authenticated user
exports.isAutheticated = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    const access_token = req.cookies.access_token;
    if (!access_token) {
        return next(new ErrorHandler_1.default("Please login to access this resource", 400));
    }
    const decoded = jsonwebtoken_1.default.decode(access_token);
    if (!decoded) {
        return next(new ErrorHandler_1.default("access token is not valid", 400));
    }
    // check if the access token is expired
    if (decoded.exp && decoded.exp <= Date.now() / 1000) {
        try {
            await (0, user_controller_1.updateAccessToken)(req, res, next);
        }
        catch (error) {
            return next(error);
        }
    }
    else {
        // const user = await redis.get(decoded.id);/
        const user = await user_model_1.default.findById(decoded.id);
        if (!user) {
            return next(new ErrorHandler_1.default("Please login to access this resource", 400));
        }
        if (user.deviceId != req.session.deviceId && user.role == "user") {
            return next(new ErrorHandler_1.default("you are not have permession to access route", 400));
        }
        ;
        // req.user = JSON.parse(user);
        req.user = user;
        next();
    }
});
// validate user role
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // console.log("role :", req.user?.role);
        if (!roles.includes(req.user?.role || "")) {
            console.log("role :", req.user?.role);
            return next(new ErrorHandler_1.default(`Role: ${req.user?.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
