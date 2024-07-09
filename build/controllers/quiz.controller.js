"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllResults = exports.getOneQuiz = exports.getMyResults = exports.submitQuiz = exports.takeQuiz = exports.getAllQuizes = exports.deleteQuiz = exports.updateQuiz = exports.takeHomework = exports.submitHomework = exports.createHomework = exports.createQuiz = void 0;
const quiz_model_1 = __importDefault(require("./../models/quiz.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const question_model_1 = __importDefault(require("../models/question.model"));
const result_model_1 = __importDefault(require("../models/result.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
// create quiz of type exam
exports.createQuiz = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quizData = req.body;
        const { startDate, endDate, duration } = quizData;
        quizData.quizType = "exam";
        if (!startDate || !endDate || !duration) {
            return next(new ErrorHandler_1.default(" startDate,endDate,duration are required", 400));
        }
        ;
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
// create quiz of type homework
exports.createHomework = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quizData = req.body;
        delete quizData.startDate;
        delete quizData.endDate;
        delete quizData.duration;
        quizData.quizType = "homework";
        if (!quizData.lessonId || !quizData.courseId) {
            return next(new ErrorHandler_1.default("lesson id and course id are required", 400));
        }
        ;
        const course = await course_model_1.default.findById(quizData.courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("course not found", 400));
        }
        ;
        const quiz = await quiz_model_1.default.create(quizData);
        const idx = course.courseData
            .findIndex(({ _id }) => _id.toString() == quizData.lessonId.toString());
        if (idx == -1) {
            return next(new ErrorHandler_1.default("lesson not found", 400));
        }
        ;
        course.courseData[idx].quizId = quiz._id;
        await course.save();
        res.status(201).json({
            success: true,
            quiz,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// submit homework
exports.submitHomework = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quiz = await quiz_model_1.default.findById(req.params.quizId);
        //req.user?.courses.push({ courseId: "666b97a594238ca851ed4e42" });
        if (!quiz || quiz.quizType == "exam") {
            return next(new ErrorHandler_1.default("there is no quiz with this id", 404));
        }
        if (!allowUserToQuiz(req.user?.courses, quiz.courseId.toString())) {
            return next(new ErrorHandler_1.default("you must enroll course first", 403));
        }
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
            user: req.user?._id
        });
        user?.quizes.push(result._id);
        await user?.save();
        res.status(201).json({
            success: true,
            result,
            questions: quesions
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// take homework
exports.takeHomework = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quiz = await quiz_model_1.default.findById(req.params.quizId);
        if (!quiz || quiz.quizType == "exam") {
            return next(new ErrorHandler_1.default("there is no quiz with this id", 404));
        }
        if (!allowUserToQuiz(req.user?.courses, quiz.courseId.toString())) {
            return next(new ErrorHandler_1.default("you must enroll course first", 403));
        }
        ;
        const questions = await question_model_1.default.find({ quiz: quiz._id });
        if (questions.length) {
            return next(new ErrorHandler_1.default("no questions found", 403));
        }
        ;
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
            const Ids = req.user?.courses.map(({ courseId }) => courseId);
            obj = { courseId: { $in: Ids } };
        }
        ;
        let quiz = await quiz_model_1.default.find({ ...obj, ...filter, ...req.query });
        // .populate({
        //   path: "results",
        //   select: "degree -quiz",
        //   populate: { path: "user", select: "name" }
        // });
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
// take quiz exam
exports.takeQuiz = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quiz = await quiz_model_1.default.findById(req.params.quizId);
        if (!quiz || quiz.quizType == "homework") {
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
        ;
        const result = await result_model_1.default.findOne({ user: req.user?._id, quiz: quiz._id });
        if (result) {
            return next(new ErrorHandler_1.default("you have already take quiz", 400));
        }
        ;
        const idx = quiz.participants.
            findIndex(({ userId }) => userId.toString() == req.user?._id.toString());
        if (idx > -1) {
            return next(new ErrorHandler_1.default("you have already taken quiz", 400));
        }
        ;
        quiz.participants.push({
            userId: req.user?._id,
            deliveredAt: new Date()
        });
        await quiz.save();
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
// submit exam
exports.submitQuiz = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quiz = await quiz_model_1.default.findById(req.params.quizId);
        //req.user?.courses.push({ courseId: "666b97a594238ca851ed4e42" });
        if (!quiz || quiz.quizType == "homework") {
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
        ;
        const idx = quiz.participants.
            findIndex(({ userId }) => userId.toString() == req.user?._id.toString());
        if (idx == -1) {
            return next(new ErrorHandler_1.default("you have not already taken quiz", 400));
        }
        ;
        const time = Date.now() - quiz.participants[idx].deliveredAt.getTime();
        if (time < quiz.duration * 60 * 1000) {
            return next(new ErrorHandler_1.default(`quiz duration is ${quiz.duration} minutes`, 400));
        }
        ;
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
const allowUserToQuiz = (courses, Id) => {
    const found = courses.some(({ courseId }) => courseId.toString() == Id.toString());
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
// get One Quiz
exports.getOneQuiz = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const quiz = await quiz_model_1.default.findById(req.params.quizId).populate({
            path: "results",
            select: "degree -quiz",
            populate: { path: "user", select: "name" }
        });
        if (!quiz) {
            return next(new ErrorHandler_1.default("quiz not found", 400));
        }
        ;
        res.status(201).json({
            success: true,
            quiz
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
exports.getAllResults = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const results = await result_model_1.default
            .find({ ...req.query })
            .sort("-degree")
            .populate([
            { path: "quiz", select: "name totalDegree" },
            { path: "user", select: "email name avatar" },
            { path: "course", select: "name description" }
        ]);
        if (results.length == 0) {
            return next(new ErrorHandler_1.default("results not found", 400));
        }
        ;
        res.status(201).json({
            success: true,
            results
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
