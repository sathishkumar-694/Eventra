import bcrypt from "bcrypt"
import { createUser, userExists } from "./auth.repository.js";
export const registerService = async(username , email , password)=>
{
    const user = await userExists(email);
    if(user.length > 0)
        throw new Error("User already exists");

    const hashedPass = await hashPassword(password);
    const result = await createUser(username , email , hashedPass);
    console.log(result)
    if(result.affectedRows === 0)
        throw new Error("Server error" )

    return result;
}

export const hashPassword = async(password)=>
{
    return await bcrypt.hash(password,10)
}