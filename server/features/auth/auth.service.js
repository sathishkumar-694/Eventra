import { createUser, findUserById, userExists } from "./auth.repository.js";
import ApiError from "../../utils/ApiError.js";
import { comparePassword, hashPassword } from "../../utils/bcrypt.js";
import { generateToken } from "../../utils/jwt.js";

const DUMMY_HASH = process.env.DUMMY_HASH

export const registerService = async(username , email , password)=>
{
    const user = await userExists(email);
    if(user.length > 0)
        throw new ApiError(400 , "User already exists");

    const hashedPass = await hashPassword(password);
    const result = await createUser(username , email , hashedPass);

    if(result.affectedRows === 0)
        throw new ApiError(500 ,"Server error" )

    return result;
}
export const loginService = async(email , password)=>
{
    const [user] = await userExists(email);

    const userPass = user? user.password : DUMMY_HASH;
    const isMatch = await comparePassword(password , userPass)

    if(!user || !isMatch)
        throw new ApiError(400 , "Invalid credentials");
    delete user.password;
    const token = await generateToken(user)
    return {user,token};        
}

export const profileService = async(id)=>
{
    const user = await findUserById(id);
    return user;

}