require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";
import quizRouter from "./routes/quiz.route";
import { rateLimit } from "express-rate-limit";
import mongoStore from "connect-mongo";
import session from "express-session";
import questionRouter from "./routes/question.route";
import resultRouter from "./routes/result.model";

// body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());
// cookie parser

// cors => cross origin resource sharing
app.use(cors({
  origin:["http://localhost:3000"],
  credentials:true
}));

app.use(session({
  name:"Session_Id",
  saveUninitialized:true,
  resave:false,
  secret:'some secret',
  cookie : {
    maxAge:4*365*24*60*60*1000
  },
  store : mongoStore.create({
    mongoUrl:process.env.DB_URL,
    ttl:4*365*24*60*60*1000
  })
}));

// api requests limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// routes
app.use(
  "/api/v1",
  userRouter,
  orderRouter,
  courseRouter,
  notificationRouter,
  analyticsRouter,
  layoutRouter,
  quizRouter,
  questionRouter,
  resultRouter
);

// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// middleware calls
app.use(limiter);
app.use(ErrorMiddleware);
