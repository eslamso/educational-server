"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const quiz_controller_1 = require("../controllers/quiz.controller");
const resultRouter = express_1.default.Router();
// get all quizes results for current user
resultRouter.get("/my-results", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("user"), quiz_controller_1.getMyResults);
exports.default = resultRouter;
