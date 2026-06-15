import jwt from "jsonwebtoken";


export const generateRefreshToken = (user)=>
{
    return jwt.sign(
        {
            id : user.id,
            role : user.role
        } , 
        process.env.JWT_REFRESH_SECRET , 
        {
            expiresIn:process.env.JWT_REFRESH_EXPIRY
        } 
    )
}

export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRY
        }
    )
}

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}
