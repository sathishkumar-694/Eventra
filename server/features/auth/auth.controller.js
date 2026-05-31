import { validate } from "../../middleware/validate.middleware.js";
import { loginService, profileService, registerService } from "./auth.service.js";
import { registerSchema } from "./auth.validation.js";

export const registerController = async (req, res, next) => {
  try {
    const { username, email, password} = req.body;
    await registerService(username, email, password);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const loginController = async(req , res , next)=>
{
	try {
		const {email , password} = req.body;
		const {user , token} = await loginService(email , password);

		return res.status(200).json({
			success:true ,
			message:"User logged in successfully",
			data : user ,
			token
		})
		
	} catch (error) {
		next(error);
	}
}

export const profileController = async(req , res , next)=>
{
	try {
		const userId = req.user.id;

		const user = await profileService(userId);
		return res.status(200).json({
			success:true,
			message :"user valid",
			user
		})
		
		
	} catch (error) {
		next(error)
	}
}
