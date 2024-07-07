import { Request } from "express";
import { IUser } from "../models/user.model";
import { Session } from "express-session";


declare global {
    namespace Express{
        interface Request{
            user?: IUser
        }
    }
}

declare module "express-session" {
    interface SessionData {
        deviceId?: string;
    }
}