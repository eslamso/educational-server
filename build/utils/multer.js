"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resizeQuestionImage = exports.uploadImage = void 0;
const multer_1 = __importDefault(require("multer"));
const ErrorHandler_1 = __importDefault(require("./ErrorHandler"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const cloudinary_1 = __importDefault(require("cloudinary"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
const unlink = (0, util_1.promisify)(fs_1.default.unlink);
const uploadImage = () => {
    const storage = multer_1.default.memoryStorage();
    const filter = function (req, file, cb) {
        if (file.mimetype.startsWith('image')) {
            return cb(null, true);
        }
        else {
            return cb(new ErrorHandler_1.default('required file of type image', 400));
        }
    };
    return (0, multer_1.default)({ storage, fileFilter: filter });
};
exports.uploadImage = uploadImage;
exports.resizeQuestionImage = (0, catchAsyncErrors_1.CatchAsyncError)(async (req, res, next) => {
    try {
        if (req.file) {
            const fileName = `${(0, uuid_1.v4)()}-${Date.now()}.jpeg`;
            await (0, sharp_1.default)(req.file.buffer)
                .resize(250, 250)
                .toFormat("jpeg")
                .jpeg({ quality: 80 })
                .toFile(`uploads/${fileName}`);
            const filePath = 'uploads' + "/" + fileName;
            const myCloud = await cloudinary_1.default.v2.uploader.upload(filePath, {
                folder: "question",
                unique_filename: false
            });
            req.body.image = myCloud.secure_url;
            await unlink(filePath);
        }
        ;
        return next();
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
