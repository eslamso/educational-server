import mongoose, { Document, Model, Schema } from "mongoose";
interface IResult extends Document {
  quiz: Schema.Types.ObjectId;
  degree: number;
  totalDegree: number;
  course: Schema.Types.ObjectId;
  user: Schema.Types.ObjectId;
}
// mongoose types
// ts types
// Date
// 

const resultSchema = new Schema<IResult>(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      required: [true, "a result must belong to quiz"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    course: {
      type: Schema.Types.ObjectId,
    },
    degree: Number,
    totalDegree: Number,
    //questions: [Schema.Types.ObjectId],
  },
  { timestamps: true }
);

const resultModel: Model<IResult> = mongoose.model("Result", resultSchema);
export default resultModel;
