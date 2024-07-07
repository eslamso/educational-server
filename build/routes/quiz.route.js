"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const quiz_controller_1 = require("../controllers/quiz.controller");
const auth_1 = require("../middleware/auth");
const question_route_1 = __importDefault(require("./question.route"));
const quizRouter = express_1.default.Router({ mergeParams: true });
quizRouter.use("/quiz/:quizId", question_route_1.default);
quizRouter.post("/create-quiz", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), quiz_controller_1.createQuiz);
quizRouter.put("/update-quiz/:quizId", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), quiz_controller_1.updateQuiz);
quizRouter.delete("/delete-quiz/:quizId", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("admin"), quiz_controller_1.deleteQuiz);
quizRouter.get("/take-quiz/:quizId", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("user"), quiz_controller_1.takeQuiz); // get questions of quiz for user
quizRouter.get("/get-All-quizes", auth_1.isAutheticated, quiz_controller_1.getAllQuizes);
quizRouter.post("/submit-quiz/:quizId", auth_1.isAutheticated, (0, auth_1.authorizeRoles)("user"), quiz_controller_1.submitQuiz);
exports.default = quizRouter;
