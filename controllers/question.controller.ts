import quizModel from "./../models/quiz.model";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import questionModel from "../models/question.model";
import cloudinary from "cloudinary";

export const createQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      if (req.params.quizId) data.quiz = req.params.quizId;
      const quiz = await quizModel.findById(data.quiz);
      if (!quiz) {
        return next(new ErrorHandler("quiz not found", 400));
      }
      const answers = data.answers;
      if (!answers.includes(data.correctAnswer)) {
        return next(
          new ErrorHandler("correct answer not included in answers", 400)
        );
      }
      const question = await questionModel.create(req.body);
      quiz.totalDegree += question.degree;
      await quiz.save();
      res.status(201).json({
        success: true,
        question,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const question = await questionModel.findById({
        _id: req.params.questionId,
      });
      if (!question) {
        return next(new ErrorHandler("quesion not found ", 404));
      }
      const quiz = await quizModel.findById(question.quiz);
      if (quiz) {
        quiz.totalDegree -= question.degree;
        await quiz.save();
      }
      await questionModel.findOneAndDelete({
        _id: req.params.questionId,
      });
      res.status(204).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      delete data.quiz;
      const question = await questionModel.findById(req.params.questionId);
      if (!question) {
        return next(new ErrorHandler("question not found", 400));
      }
      const quiz = await quizModel.findById(question.quiz);
      if (!quiz) {
        return next(new ErrorHandler("quiz not found", 400));
      }
      const answers = data.answers;
      if (req.body.answers && !answers.includes(data.correctAnswer)) {
        return next(
          new ErrorHandler("correct answer not included in answers", 400)
        );
      }
      if (req.body.degree) {
        quiz.totalDegree -= question.degree;
        quiz.totalDegree += req.body.degree;
        await quiz.save();
      }

      await questionModel.findByIdAndUpdate(req.params.questionId, data, {
        new: true,
      });
      res.status(200).json({
        success: true,
        question,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllQuestions = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let fliter = {};
      if (req.params.quizId) fliter = { quiz: req.params.quizId };
      const questions = await questionModel.find(fliter);
      if (questions.length == 0) {
        return next(new ErrorHandler("questions not found", 400));
      }
      res.status(200).json({
        success: true,
        questions,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
