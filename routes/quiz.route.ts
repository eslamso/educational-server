import quizModel from "./../models/quiz.model";
import express, { Request, Response, NextFunction } from "express";

import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  createQuiz,
  deleteQuiz,
  getAllQuizes,
  submitQuiz,
  takeQuiz,
  updateQuiz,
} from "../controllers/quiz.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import questionRouter from "./question.route";
const quizRouter = express.Router({ mergeParams: true });
quizRouter.use("/quiz/:quizId", questionRouter);
quizRouter.post(
  "/create-quiz",
  isAutheticated,
  authorizeRoles("admin"),
  createQuiz
);
quizRouter.put(
  "/update-quiz/:quizId",
  isAutheticated,
  authorizeRoles("admin"),
  updateQuiz
);
quizRouter.delete(
  "/delete-quiz/:quizId",
  isAutheticated,
  authorizeRoles("admin"),
  deleteQuiz
);
quizRouter.get(
  "/take-quiz/:quizId",
  isAutheticated,
  authorizeRoles("user"),
  takeQuiz
); // get questions of quiz for user
quizRouter.get(
  "/get-All-quizes", 
  isAutheticated,
  getAllQuizes);
quizRouter.post(
  "/submit-quiz/:quizId",
  isAutheticated,
  authorizeRoles("user"),
  submitQuiz
);

export default quizRouter;
