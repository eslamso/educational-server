import express, { Request, Response, NextFunction } from "express";

import { CatchAsyncError } from "../middleware/catchAsyncErrors";

import { authorizeRoles, isAutheticated } from "../middleware/auth";

import { getMyResults } from "../controllers/quiz.controller";
const resultRouter = express.Router();
// get all quizes results for current user
resultRouter.get(
  "/my-results",
  isAutheticated,
  authorizeRoles("user"),
  getMyResults
);
export default resultRouter;
