import mongoose, { Document, Model, Schema } from "mongoose";
interface IQuiz extends Document {
  name: string;
  courseId: Schema.Types.ObjectId;
  totalDegree: number;
  isOpened: boolean;
  quizType: string;
  startDate: Date;
  endDate: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    name: {
      type: String,
      required: [true, "a quiz must have a name"],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      required: [true, "a quiz must belong to a course"],
    },
    totalDegree: {
      type: Number,
      //required: [true, "a quiz must have total degree"],
      default: 0,
    },
    isOpened: {
      type: Boolean,
      default: true,
    },
    //questions: [Schema.Types.ObjectId],
    startDate: {
      type: Date,
      required: [true, "a quiz must have start Date"],
    },
    endDate: {
      type: Date,
      required: [true, "a quiz must have end Date"],
      validate: {
        validator: function (date: Date):boolean {
          // @ts-ignore
          return date.getTime() > this.startDate;
        },
        message: `endDate must greater than start Date`,
      },
    },
    quizType: {
      type: String,
      default: "homework",
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
