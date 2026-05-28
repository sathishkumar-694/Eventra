import { loginService, registerService } from "./auth.service.js";

export const registerController = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
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
		const user = await loginService(email , password);

		return res.status(200).json({
			success:true ,
			message:"User logged in successfully",
			data : user ,
			token : user.token
		})
		
	} catch (error) {
		next(error);
	}
}
