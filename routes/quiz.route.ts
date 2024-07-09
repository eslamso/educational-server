import quizModel from "./../models/quiz.model";
import express, { Request, Response, NextFunction } from "express";

import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  createHomework,
  createQuiz,
  deleteQuiz,
  getAllQuizes,
  getAllResults,
  getOneQuiz,
  submitHomework,
  submitQuiz,
  takeHomework,
  takeQuiz,
  updateQuiz,
} from "../controllers/quiz.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import questionRouter from "./question.route";
const quizRouter = express.Router({ mergeParams: true });
quizRouter.use("/quiz/:quizId", questionRouter);
// create quiz of type exam
quizRouter.post(
  "/create-quiz",
  isAutheticated,
  authorizeRoles("admin"),
  createQuiz
);
// create quiz of type homework
quizRouter.post(
  "/create-homework",
  isAutheticated,
  authorizeRoles("admin"),
  createHomework
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

// get quizzes of quiz for user
quizRouter.get("/get-All-quizes", isAutheticated, getAllQuizes);
// get one quiz
quizRouter.get(
  "/get-One-Quiz/:quizId",
  isAutheticated,
  authorizeRoles("admin"),
  getOneQuiz
);
//take quiz of type exam
quizRouter.get(
  "/take-quiz/:quizId",
  isAutheticated,
  authorizeRoles("user"),
  takeQuiz
);
//take quiz of type homework
quizRouter.get(
  "/take-homework/:quizId",
  isAutheticated,
  authorizeRoles("user"),
  takeHomework
);

// submit quiz of type exam
quizRouter.post(
  "/submit-quiz/:quizId",
  isAutheticated,
  authorizeRoles("user"),
  submitQuiz
);
// submit quiz of type exam
quizRouter.post(
  "/submit-homework/:quizId",
  isAutheticated,
  authorizeRoles("user"),
  submitHomework
);

//get all results (admin)
quizRouter.get(
  "/get-All-Results",
  isAutheticated,
  authorizeRoles("admin"),
  getAllResults
);

export default quizRouter;
