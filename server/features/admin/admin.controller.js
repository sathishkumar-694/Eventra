import { getAllPendingEventsService } from "./admin.service"

export const getPendingEventsController = async(req , res , next)=>
{
    try {
        const response = await getAllPendingEventsService();
        
    } catch (error) {
        next(error)
    }
}

export const getRejectedEventsController = async(req , res , next)=>
{
    try {
        
    } catch (error) {
        next(error)
    }
}