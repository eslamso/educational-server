import quizModel from "./../models/quiz.model";
import  { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import questionModel from "../models/question.model";
import resultModel from "../models/result.model";


export const createQuiz = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quizData = req.body;
      // course id from url
      if (req.params.id) req.body.courseId = req.params.id;

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
      let obj={};
      if (req.user?.role === "user") {
        let quizIds = await quizModel.find({
          courseId: { $in: req.user?.courses.map( ({ courseId }) => courseId ) },
        }).select("_id");
        const ids=quizIds.map( ( { _id } ) => _id  );
        obj={ _id : { $in : ids } };
      }
      let quiz = await quizModel.find({ ... obj , ... filter  }).populate({
        path: "results",
        select: "degree -quiz",
        populate: { path: "user", select: "name" },
      });
      if( quiz.length == 0 ){
        return next( new ErrorHandler("no quiz found",400) );
      };
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

export const takeQuiz = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quiz = await quizModel.findById(req.params.quizId);
      //req.user?.courses.push({ courseId: "666b97a594238ca851ed4e42" });
      if (!quiz) {
        return next(new ErrorHandler("there is no quiz with this id", 404));
      }
      if (quiz?.startDate.getTime() >= Date.now()) {
        return next(new ErrorHandler("quiz is not started yet", 400));
      }

      if (!allowUserToQuiz( req.user?.courses!, quiz.courseId.toString() )) {
        return next(new ErrorHandler("you must enroll course first", 403));
      }
      
      if (quiz?.endDate.getTime() <= Date.now()) {
        return next(new ErrorHandler("sorry quiz time out", 400));
      }
      const result=await resultModel.findOne({ user: req.user?._id , quiz:quiz._id });
      if( result ){
        return next( new ErrorHandler("you have already take quiz",400) )
      };
      //checkQuizVaildation(quiz, req, next);
      const questions = await questionModel.find({ quiz: quiz._id });
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

export const submitQuiz = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quiz = await quizModel.findById(req.params.quizId);
      //req.user?.courses.push({ courseId: "666b97a594238ca851ed4e42" });

      if (!quiz) {
        return next(new ErrorHandler("there is no quiz with this id", 404));
      }
      if ( quiz?.startDate.getTime() >= Date.now() ) {
        return next(new ErrorHandler("quiz is not started yet", 400));
      }

      if (!allowUserToQuiz(req.user?.courses!, quiz.courseId.toString() )) {
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
      //req.body contains question Id and aswar
      const userAnswers = req.body.answers as { question:string; ans:string }[];
      // console.log(userAnswars);
      const user = req.user;
      const courseId = quiz?.courseId;
      const quesions = await questionModel
        .find
        ({ courseId, _id : { $in : userAnswers.map( ({question}) => question ) } });
      // console.log(quesions);
      if( quesions.length != userAnswers.length ){
        return next(new ErrorHandler("questions not found",400));
      };
      
      let result=await resultModel.findOne({ user: req.user?._id , quiz:quiz._id });
      if( result ){
        return next( new ErrorHandler("you have already take quiz",400) )
      };

      let deg = 0;
      for( const { question:id , ans } of userAnswers ){
        const question=await questionModel.findById(id);
        if( question?.correctAnswer == ans  ){
          deg += question.degree;
        };
      };
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

const allowUserToQuiz = (courses: {courseId:string}[] , quizId:string) => {
  let found: boolean = false;
  courses.map((el) => {
    if (el.courseId.toString() === quizId.toString()) {
      found = true;
      return found;
    }
  });
  return found;
};


export const getMyResults = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user?.quizes.length === 0) {
        return next(new ErrorHandler("there is no results to display", 404));
      }
      const user = await req.user?.populate
        ({ 
          path: "quizes", 
          select: "-user",
          populate : [ { path : "quiz" } , {path:"course"} ]
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
