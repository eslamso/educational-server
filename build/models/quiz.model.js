"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const quizSchema = new mongoose_1.Schema({
    participants: [
        { userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" }, deliveredAt: Date }
    ],
    name: {
        type: String,
        required: [true, "a quiz must have a name"],
    },
    duration: Number,
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Course",
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
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
});
quizSchema.virtual("results", {
    ref: "Result",
    localField: "_id",
    foreignField: "quiz",
});
const quizModel = mongoose_1.default.model("Quiz", quizSchema);
exports.default = quizModel;
