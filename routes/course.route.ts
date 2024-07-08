import express from "express";
import {
  addAnwser,
  addQuestion,
  addReplyToReview,
  addReview,
  deleteCourse,
  editCourse,
  generateVideoUrl,
  getAdminAllCourses,
  getAllCourses,
  getCourseByUser,
  getSingleCourse,
  readPdf,
  uploadCourse,
  uploadPdf,
} from "../controllers/course.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";
import quizRouter from "./quiz.route";
import {
  uploadSinglePdf,
  resizeCourseThumbnail,
  uploadImage,
} from "../utils/multer";
const courseRouter = express.Router();
courseRouter.use("/course/:id/", quizRouter);
courseRouter.post(
  "/create-course",
  isAutheticated,
  authorizeRoles("admin"),
  uploadImage().single("thumbnail"),
  resizeCourseThumbnail,
  uploadCourse
);

courseRouter
  .route("/pdf/:courseId/lesson/:lessonId")
  .get(isAutheticated, readPdf);
courseRouter
  .route("/pdf")
  .post(
    isAutheticated,
    authorizeRoles("admin"),
    uploadSinglePdf("pdf"),
    uploadPdf
  );

courseRouter.put(
  "/edit-course/:id",
  isAutheticated,
  authorizeRoles("admin"),
  uploadImage().single("thumbnail"),
  resizeCourseThumbnail,
  editCourse
);

courseRouter.get("/get-course/:id", getSingleCourse);

courseRouter.get("/get-courses", getAllCourses);

courseRouter.get(
  "/get-admin-courses",
  isAutheticated,
  authorizeRoles("admin"),
  getAdminAllCourses
);

courseRouter.get("/get-course-content/:id", isAutheticated, getCourseByUser);

courseRouter.put("/add-question", isAutheticated, addQuestion);

courseRouter.put("/add-answer", isAutheticated, addAnwser);

courseRouter.put("/add-review/:id", isAutheticated, addReview);

courseRouter.put(
  "/add-reply",
  isAutheticated,
  authorizeRoles("admin"),
  addReplyToReview
);

courseRouter.post("/getVdoCipherOTP", generateVideoUrl);

courseRouter.delete(
  "/delete-course/:id",
  isAutheticated,
  authorizeRoles("admin"),
  deleteCourse
);

export default courseRouter;
