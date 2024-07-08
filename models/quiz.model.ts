import mongoose, { Document, Model, Schema } from "mongoose";
interface IQuiz extends Document {
  name: string;
  courseId: Schema.Types.ObjectId;
  totalDegree: number;
  lessonId: Schema.Types.ObjectId;
  quizType: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  participants?:{ userId:Schema.Types.ObjectId; deliveredAt:Date }[];
}

const quizSchema = new Schema<IQuiz>(
  {
    participants:[
      { userId : { type:Schema.Types.ObjectId , ref:"User" } , deliveredAt:Date }
    ],
    name: {
      type: String,
      required: [true, "a quiz must have a name"],
    },
    duration:Number,
    courseId: {
      type: Schema.Types.ObjectId,
      required: [true, "a quiz must belong to a course"],
    },
    totalDegree: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    quizType: {
      type: String,
      default: "exam",
      enum: ["exam", "homework"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);
quizSchema.virtual("results", {
  ref: "Result",
  localField: "_id",
  foreignField: "quiz",
});
const quizModel: Model<IQuiz> = mongoose.model("Quiz", quizSchema);
export default quizModel;
