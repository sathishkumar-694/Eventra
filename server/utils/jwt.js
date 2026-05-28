import jwt from "jsonwebtoken";

export const generateToken = async(user)=>
{
    return await jwt.sign(
        {
            id : user.id,
            role : user.role
        } , 
        process.env.JWT_SECRET , 
        {
            expiresIn:process.env.JWT_EXPIRY
        } 
    )
}