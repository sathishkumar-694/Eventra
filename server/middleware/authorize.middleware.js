export const authorize = (...roles)=>
{
    return (req , res , next)=>
    {
        try{
        if(!roles.includes(req.user.role))
        {
            return res.status(403).json({
                success: false ,
                message : "You do not have permission to access this resource"
            })
        }
        next();
    }
    catch(error)
    {
        next(error);
    }
    }
}