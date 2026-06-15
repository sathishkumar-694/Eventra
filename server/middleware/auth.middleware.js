import jwt from "jsonwebtoken"
import ApiError from "../utils/ApiError.js"

export const getMe = async(req , res , next)=>
{
    try {
        const header = req.headers.authorization;
        if(!header)
        {
            throw new ApiError(400 , "No Token");
        }
        const token = header.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
        req.user = decoded;
        
        next();

    } catch (error) {
        next(error)
    }
}