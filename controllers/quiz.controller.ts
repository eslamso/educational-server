import quizModel from "./../models/quiz.model";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import questionModel from "../models/question.model";
import resultModel from "../models/result.model";
import CourseModel from "../models/course.model";

// create quiz of type exam
export const createQuiz = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quizData = req.body;
      const { startDate, endDate, duration } = quizData;
      quizData.quizType = "exam";
      if (!startDate || !endDate || !duration) {
        return next(
          new ErrorHandler(" startDate,endDate,duration are required", 400)
        );
      }
      const quiz = await quizModel.create(quizData);
      res.status(201).json({
        success: true,
        quiz,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// create quiz of type homework
export const createHomework = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quizData = req.body;
      delete quizData.startDate;
      delete quizData.endDate;
      delete quizData.duration;
      quizData.quizType = "homework";
      if (!quizData.lessonId || !quizData.courseId) {
        return next(
          new ErrorHandler("lesson id and course id are required", 400)
        );
      }
      const course = await CourseModel.findById(quizData.courseId);
      if (!course) {
        return next(new ErrorHandler("course not found", 400));
      }
      const quiz = await quizModel.create(quizData);
      const idx = course.courseData.findIndex(
        ({ _id }) => _id.toString() == quizData.lessonId.toString()
      );
      if (idx == -1) {
        return next(new ErrorHandler("lesson not found", 400));
      }
      course.courseData[idx].quizId = quiz._id;
      await course.save();
      res.status(201).json({
        success: true,
        quiz,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// submit homework
export const submitHomework = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quiz = await quizModel.findById(req.params.quizId);
      //req.user?.courses.push({ courseId: "666b97a594238ca851ed4e42" });

      if (!quiz || quiz.quizType == "exam") {
        return next(new ErrorHandler("there is no quiz with this id", 404));
      }

      if (!allowUserToQuiz(req.user?.courses!, quiz.courseId.toString())) {
        return next(new ErrorHandler("you must enroll course first", 403));
      }
      const userAnswers = req.body.answers as {
        question: string;
        ans: string;
      }[];
      // console.log(userAnswars);
      const user = req.user;
      const courseId = quiz?.courseId;
      const quesions = await questionModel.find({
        courseId,
        _id: { $in: userAnswers.map(({ question }) => question) },
      });
      // console.log(quesions);
      if (quesions.length != userAnswers.length) {
        return next(new ErrorHandler("questions not found", 400));
      }

      let result = await resultModel.findOne({
        user: req.user?._id,
        quiz: quiz._id,
      });
      if (result) {
        return next(new ErrorHandler("you have already take quiz", 400));
      }

      let deg = 0;
      for (const { question: id, ans } of userAnswers) {
        const question = await questionModel.findById(id);
        if (question?.correctAnswer == ans) {
          deg += question.degree;
        }
      }

      result = await resultModel.create({
        quiz: quiz?._id,
        degree: deg,
        totalDegree: quiz?.totalDegree,
        course: courseId,
        user: req.user?._id,
      });

      user?.quizes.push(result._id);
      await user?.save();
      res.status(201).json({
        success: true,
        result,
        questions: quesions,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// take homework
export const takeHomework = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quiz = await quizModel.findById(req.params.quizId);
      if (!quiz || quiz.quizType == "exam") {
        return next(new ErrorHandler("there is no quiz with this id", 404));
      }
      if (!allowUserToQuiz(req.user?.courses!, quiz.courseId.toString())) {
        return next(new ErrorHandler("you must enroll course first", 403));
      }
      const questions = await questionModel.find({ quiz: quiz._id });
      if (questions.length == 0) {
        return next(new ErrorHandler("no questions found", 403));
      }
      res.status(201).json({
        success: true,
        results: questions.length,
        questions,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateQuiz = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quizId = req.params.quizId;
      const quiz = await quizModel.findOneAndUpdate({ _id: quizId }, req.body, {
        new: true,
      });
      if (!quiz) {
        return next(new ErrorHandler("no quiz found", 404));
      }
      res.status(200).json({
        success: true,
        quiz,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteQuiz = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quizId = req.params.quizId;
      const quiz = await quizModel.findOneAndDelete({ _id: quizId });
      if (!quiz) {
        return next(new ErrorHandler("no quiz found with this id", 404));
      }
      res.status(204).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllQuizes = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let filter = {};
      if (req.params.id) filter = { courseId: req.params.id };
      let obj = {};
      if (req.user?.role === "user") {
        const Ids = req.user?.courses.map(({ courseId }) => courseId);
        obj = { courseId: { $in: Ids } };
      }

      let quiz = await quizModel.find({ ...obj, ...filter, ...req.query });
      // .populate({
      //   path: "results",
      //   select: "degree -quiz",
      //   populate: { path: "user", select: "name" }
      // });
      if (quiz.length == 0) {
        return next(new ErrorHandler("no quiz found", 400));
      }

      res.status(200).json({
        success: true,
        result: quiz.length,
        quiz,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// take quiz exam
export const takeQuiz = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quiz = await quizModel.findById(req.params.quizId);
      if (!quiz || quiz.quizType == "homework") {
        return next(new ErrorHandler("there is no quiz with this id", 404));
      }
      if (quiz?.startDate.getTime() >= Date.now()) {
        return next(new ErrorHandler("quiz is not started yet", 400));
      }

      if (!allowUserToQuiz(req.user?.courses!, quiz.courseId.toString())) {
        return next(new ErrorHandler("you must enroll course first", 403));
      }

      if (quiz?.endDate.getTime() <= Date.now()) {
        return next(new ErrorHandler("sorry quiz time out", 400));
      }

      const result = await resultModel.findOne({
        user: req.user?._id,
        quiz: quiz._id,
      });
      if (result) {
        return next(new ErrorHandler("you have already take quiz", 400));
      }

      const idx = quiz.participants.findIndex(
        ({ userId }) => userId.toString() == req.user?._id.toString()
      );
      if (idx > -1) {
        return next(new ErrorHandler("you have already taken quiz", 400));
      }
      quiz.participants.push({
        userId: req.user?._id,
        deliveredAt: new Date(),
      });

      await quiz.save();
      const questions = await questionModel
        .find({ quiz: quiz._id })
        .select("-correctAnswer");
      res.status(201).json({
        success: true,
        quizDuration: quiz.duration,
        results: questions.length,
        questions,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// submit exam
export const submitQuiz = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quiz = await quizModel.findById(req.params.quizId);
      //req.user?.courses.push({ courseId: "666b97a594238ca851ed4e42" });

      if (!quiz || quiz.quizType == "homework") {
        return next(new ErrorHandler("there is no quiz with this id", 404));
      }
      if (quiz?.startDate.getTime() >= Date.now()) {
        return next(new ErrorHandler("quiz is not started yet", 400));
      }

      if (!allowUserToQuiz(req.user?.courses!, quiz.courseId.toString())) {
        return next(new ErrorHandler("you must enroll course first", 403));
      }

      if (quiz?.endDate.getTime() <= Date.now()) {
        return next(
          new ErrorHandler(
            "sorry quiz time out and your answers are not sent",
            400
          )
        );
      }

      const idx = quiz.participants.findIndex(
        ({ userId }) => userId.toString() == req.user?._id.toString()
      );
      if (idx == -1) {
        return next(new ErrorHandler("you have not already taken quiz", 400));
      }

      const time = Date.now() - quiz.participants[idx].deliveredAt.getTime();
      console.log(time * 1000, quiz.duration * 60 * 1000);
      if (time * 1000 < quiz.duration * 60 * 1000) {
        return next(
          new ErrorHandler(`quiz duration is ${quiz.duration} minutes`, 400)
        );
      }

      const userAnswers = req.body.answers as {
        question: string;
        ans: string;
      }[];
      // console.log(userAnswars);
      const user = req.user;
      const courseId = quiz?.courseId;
      const quesions = await questionModel.find({
        quiz: quiz._id,
        _id: { $in: userAnswers.map(({ question }) => question) },
      });
      //console.log(quesions);
      if (quesions.length != userAnswers.length) {
        return next(new ErrorHandler("questions not found", 400));
      }

      let result = await resultModel.findOne({
        user: req.user?._id,
        quiz: quiz._id,
      });
      if (result) {
        return next(new ErrorHandler("you have already take quiz", 400));
      }

      let deg = 0;
      for (const { question: id, ans } of userAnswers) {
        const question = await questionModel.findById(id);
        if (question?.correctAnswer == ans) {
          deg += question.degree;
        }
      }
      result = await resultModel.create({
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

const allowUserToQuiz = (courses: { courseId: string }[], Id: string) => {
  const found = courses.some(({ courseId }) => courseId == Id);
  return found;
};

export const getMyResults = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user?.quizes.length === 0) {
        return next(new ErrorHandler("there is no results to display", 404));
      }
      const user = await req.user?.populate({
        path: "quizes",
        select: "-user",
        populate: [{ path: "quiz" }, { path: "course" }],
      });
      res.status(201).json({
        success: true,
        result: user?.quizes,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get One Quiz
export const getOneQuiz = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quiz = await quizModel.findById(req.params.quizId).populate({
        path: "results",
        select: "degree -quiz",
        populate: { path: "user", select: "name" },
      });
      if (!quiz) {
        return next(new ErrorHandler("quiz not found", 400));
      }
      res.status(201).json({
        success: true,
        quiz,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllResults = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await resultModel
        .find({ ...req.query })
        .sort("-degree")
        .populate([
          { path: "quiz", select: "name totalDegree" },
          { path: "user", select: "email name avatar" },
          { path: "course", select: "name description" },
        ]);
      if (results.length == 0) {
        return next(new ErrorHandler("results not found", 400));
      }
      res.status(201).json({
        success: true,
        results,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
