import { approveEventsService, getAllEventsService, getApprovedEventsService, getPendingEventsService, getRejectedEventsService, rejectEventsService } from "./admin.service"

export const getAllEventsController = async(req , res , next)=>
{
    try {
        const response = await getAllEventsService();
        return res.status(200).json({
            success : true,
            response
        })
    } catch (error) {
        next(error)
    }
}

export const getPendingEventsController = async(req , res , next)=>
{
    try {
        const response = await getPendingEventsService();
        return res.status(200).json({
            success : true,
            response
        })
    } catch (error) {
        next(error)
    }
}

export const getApprovedEventsController = async(req , res , next)=>
{
    try {
         const response = await getApprovedEventsService();
        return res.status(200).json({
            success : true,
            response
        })
        
    } catch (error) {
        next(error)
    }
}

export const getRejectedEventsController = async(req , res , next)=>
{
    try {
         const response = await getRejectedEventsService();
        return res.status(200).json({
            success : true,
            response
        })
        
    } catch (error) {
        next(error)
    }
}

export const approveEventsController = async(req , res , next)=>
{
    try{
        const response = await approveEventsService(req.params.id , req.user.id);
        return res.status(200).json({
            success:true,
            message : "Event approved"
        })

    }
    catch(err)
    {
        next(err)
    }
}

export const rejectEventsController = async(req , res , next)=>
{
    try{
        const response = await rejectEventsService(req.params.id , req.reason);
        return res.status(200).json({
            success:true,
            message : "Event rejected"
        })

    }
    catch(err)
    {
        next(err)
    }
}