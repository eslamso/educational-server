"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyResults = exports.submitQuiz = exports.takeQuiz = exports.getAllQuizes = exports.deleteQuiz = exports.updateQuiz = exports.createQuiz = void 0;
const quiz_model_1 = __importDefault(require("./../models/quiz.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const question_model_1 = __importDefault(require("../models/question.model"));
const result_model_1 = __importDefault(require("../models/result.model"));
exports.createQuiz = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quizData = req.body;
        // course id from url
        if (req.params.id)
            req.body.courseId = req.params.id;
        const quiz = await quiz_model_1.default.create(quizData);
        res.status(201).json({
            success: true,
            quiz,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.updateQuiz = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quizId = req.params.quizId;
        const quiz = await quiz_model_1.default.findOneAndUpdate({ _id: quizId }, req.body, {
            new: true,
        });
        if (!quiz) {
            return next(new ErrorHandler_1.default("no quiz found", 404));
        }
        res.status(200).json({
            success: true,
            quiz,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.deleteQuiz = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quizId = req.params.quizId;
        const quiz = await quiz_model_1.default.findOneAndDelete({ _id: quizId });
        if (!quiz) {
            return next(new ErrorHandler_1.default("no quiz found with this id", 404));
        }
        res.status(204).json({
            success: true,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.getAllQuizes = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        let filter = {};
        if (req.params.id)
            filter = { courseId: req.params.id };
        let obj = {};
        if (req.user?.role === "user") {
            let quizIds = await quiz_model_1.default.find({
                courseId: { $in: req.user?.courses.map(({ courseId }) => courseId) },
            }).select("_id");
            const ids = quizIds.map(({ _id }) => _id);
            obj = { _id: { $in: ids } };
        }
        let quiz = await quiz_model_1.default.find({ ...obj, ...filter }).populate({
            path: "results",
            select: "degree -quiz",
            populate: { path: "user", select: "name" },
        });
        if (quiz.length == 0) {
            return next(new ErrorHandler_1.default("no quiz found", 400));
        }
        ;
        res.status(200).json({
            success: true,
            result: quiz.length,
            quiz,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.takeQuiz = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quiz = await quiz_model_1.default.findById(req.params.quizId);
        //req.user?.courses.push({ courseId: "666b97a594238ca851ed4e42" });
        if (!quiz) {
            return next(new ErrorHandler_1.default("there is no quiz with this id", 404));
        }
        if (quiz?.startDate.getTime() >= Date.now()) {
            return next(new ErrorHandler_1.default("quiz is not started yet", 400));
        }
        if (!allowUserToQuiz(req.user?.courses, quiz.courseId.toString())) {
            return next(new ErrorHandler_1.default("you must enroll course first", 403));
        }
        if (quiz?.endDate.getTime() <= Date.now()) {
            return next(new ErrorHandler_1.default("sorry quiz time out", 400));
        }
        const result = await result_model_1.default.findOne({ user: req.user?._id, quiz: quiz._id });
        if (result) {
            return next(new ErrorHandler_1.default("you have already take quiz", 400));
        }
        ;
        //checkQuizVaildation(quiz, req, next);
        const questions = await question_model_1.default.find({ quiz: quiz._id });
        res.status(201).json({
            success: true,
            results: questions.length,
            questions,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.submitQuiz = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quiz = await quiz_model_1.default.findById(req.params.quizId);
        //req.user?.courses.push({ courseId: "666b97a594238ca851ed4e42" });
        if (!quiz) {
            return next(new ErrorHandler_1.default("there is no quiz with this id", 404));
        }
        if (quiz?.startDate.getTime() >= Date.now()) {
            return next(new ErrorHandler_1.default("quiz is not started yet", 400));
        }
        if (!allowUserToQuiz(req.user?.courses, quiz.courseId.toString())) {
            return next(new ErrorHandler_1.default("you must enroll course first", 403));
        }
        if (quiz?.endDate.getTime() <= Date.now()) {
            return next(new ErrorHandler_1.default("sorry quiz time out and your answers are not sent", 400));
        }
        //req.body contains question Id and aswar
        const userAnswers = req.body.answers;
        // console.log(userAnswars);
        const user = req.user;
        const courseId = quiz?.courseId;
        const quesions = await question_model_1.default
            .find({ courseId, _id: { $in: userAnswers.map(({ question }) => question) } });
        // console.log(quesions);
        if (quesions.length != userAnswers.length) {
            return next(new ErrorHandler_1.default("questions not found", 400));
        }
        ;
        let result = await result_model_1.default.findOne({ user: req.user?._id, quiz: quiz._id });
        if (result) {
            return next(new ErrorHandler_1.default("you have already take quiz", 400));
        }
        ;
        let deg = 0;
        for (const { question: id, ans } of userAnswers) {
            const question = await question_model_1.default.findById(id);
            if (question?.correctAnswer == ans) {
                deg += question.degree;
            }
            ;
        }
        ;
        result = await result_model_1.default.create({
            quiz: quiz?._id,
            degree: deg,
            totalDegree: quiz?.totalDegree,
            course: courseId,
            user: req.user?.id,
        });
        user?.quizes.push(result._id);
        await user?.save();
        res.status(201).json({
            success: true,
            result,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
const allowUserToQuiz = (courses, quizId) => {
    let found = false;
    courses.map((el) => {
        if (el.courseId.toString() === quizId.toString()) {
            found = true;
            return found;
        }
    });
    return found;
};
exports.getMyResults = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        if (req.user?.quizes.length === 0) {
            return next(new ErrorHandler_1.default("there is no results to display", 404));
        }
        const user = await req.user?.populate({
            path: "quizes",
            select: "-user",
            populate: [{ path: "quiz" }, { path: "course" }]
        });
        res.status(201).json({
            success: true,
            result: user?.quizes,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
