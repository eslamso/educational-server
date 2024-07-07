"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllQuestions = exports.updateQuestion = exports.deleteQuestion = exports.createQuestion = void 0;
const quiz_model_1 = __importDefault(require("./../models/quiz.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const question_model_1 = __importDefault(require("../models/question.model"));
exports.createQuestion = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        if (req.params.quizId)
            data.quiz = req.params.quizId;
        const quiz = await quiz_model_1.default.findById(data.quiz);
        if (!quiz) {
            return next(new ErrorHandler_1.default("quiz not found", 400));
        }
        ;
        const question = await question_model_1.default.create(req.body);
        quiz.totalDegree += question.degree;
        await quiz.save();
        res.status(201).json({
            success: true,
            question
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.deleteQuestion = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const question = await question_model_1.default.findById({
            _id: req.params.questionId,
        });
        if (!question) {
            return next(new ErrorHandler_1.default("quesion not found ", 404));
        }
        const quiz = await quiz_model_1.default.findById(question.quiz);
        if (quiz) {
            quiz.totalDegree -= question.degree;
            await quiz.save();
        }
        ;
        await question_model_1.default.findOneAndDelete({
            _id: req.params.questionId,
        });
        res.status(204).json({
            success: true,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.updateQuestion = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        delete data.quiz;
        const question = await question_model_1.default.findById(req.params.questionId);
        if (!question) {
            return next(new ErrorHandler_1.default("question not found", 400));
        }
        ;
        const quiz = await quiz_model_1.default.findById(question.quiz);
        if (!quiz) {
            return next(new ErrorHandler_1.default("quiz not found", 400));
        }
        ;
        if (req.body.degree) {
            quiz.totalDegree -= question.degree;
            quiz.totalDegree += req.body.degree;
            await quiz.save();
        }
        ;
        await question_model_1.default.findByIdAndUpdate(req.params.questionId, data, { new: true });
        res.status(200).json({
            success: true,
            question,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.getAllQuestions = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        let fliter = {};
        if (req.params.quizId)
            fliter = { quiz: req.params.quizId };
        const questions = await question_model_1.default.find(fliter);
        if (questions.length == 0) {
            return next(new ErrorHandler_1.default("questions not found", 400));
        }
        ;
        res.status(200).json({
            success: true,
            questions,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
