import { NextFunction, Request } from "express";
import multer from "multer";
import ErrorHandler from "./ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import cloudinary from "cloudinary";
import fs from "fs";
import { promisify } from "util";
import sharp from "sharp";
import { v4 } from "uuid";
const unlink=promisify(fs.unlink);

export const uploadImage=()=>{
    const storage=multer.memoryStorage();
    const filter=function
    (req:Request,file:Express.Multer.File,cb:multer.FileFilterCallback){
        if(file.mimetype.startsWith('image')){
            return cb(null,true);
        }else{
            return cb(new ErrorHandler('required file of type image',400) );
        }
    };
    return multer({storage,fileFilter:filter});
};

export const resizeQuestionImage = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
    try {
        if ( req.file ) {
            const fileName=`${v4()}-${Date.now()}.jpeg`;
            await sharp(req.file.buffer)
                .resize(250,250)
                .toFormat("jpeg")
                .jpeg({ quality : 80 })
                .toFile(`uploads/${fileName}`);
            const filePath='uploads'+"/"+fileName;
            const myCloud = await cloudinary.v2.uploader.upload(filePath, {
                folder: "question",
                unique_filename:false
            });
            req.body.image = myCloud.secure_url;
            await unlink(filePath);
        };
        return next();
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
});
