require("dotenv").config();
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  quizes: Schema.Types.ObjectId[];
  deviceId?: string;
  role: string;
  isVerified: boolean;
  resetDeviceCode?: string;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "please enter a valid email",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetDeviceCode: String,
    deviceId: String,
    courses: [
      {
        courseId: String,
      },
    ],
    quizes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Result",
      },
    ],
  },
  { timestamps: true }
);
// quizModel.find({courseId:{$in:req.user.courses}}) return all courses quizes
/*
{
  quiz:Schema.Types.ObjectId,
  ref:"Quiz",
  takenAt:Date.now();
  degree:string,
  totalDegree:String
}
*/
/*
[{ questionId: string, answar: string }];
 */

//populating quizes
/*
userSchema.pre<IUser>(/^find/, function (next) {
  this.populate({ path: "quizes" });
  next();
});
*/
// Hash Password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// sign access token
userSchema.methods.SignAccessToken = function () {
  return jwt.sign(
    { id: this._id, deviceId: this.deviceId },
    process.env.ACCESS_TOKEN || "",
    {
      expiresIn: "5m",
    }
  );
};

// sign refresh token
userSchema.methods.SignRefreshToken = function () {
  return jwt.sign(
    { id: this._id, deviceId: this.deviceId },
    process.env.REFRESH_TOKEN || "",
    {
      expiresIn: "300d",
    }
  );
};

// compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);

export default userModel;
