        import { registerService } from "./auth.service.js";

        export const registerController = async(req , res , next)=>
        {
                try{
                const {username ,email , password} = req.body;
                await registerService(username , email , password);

                return res.status(201).json({
                        success:true,
                        message:"User registered successfully"
                })
                }
                catch(error)
                {
                        next(error)
                }

        }