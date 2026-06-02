import ApiError from "../../utils/ApiError";
import { getEventByIdRepository } from "../events/event.repository.js";
import { approveEventsRepository, getAllEventsRepository, getAllPendingEventsRepository, getApprovedEventsRepository, getRejectedEventsRepository, rejectEventsRepository } from "./admin.repository.js"

export const getAllEventsService = async()=>
{
    const response = await getAllEventsRepository();
    return response;
}

export const getPendingEventsService = async()=>
{
    const response = await getAllPendingEventsRepository();
    return response;
}

export const getApprovedEventsService = async()=>
{
    const response = await getApprovedEventsRepository();
    return response;
}

export const getRejectedEventsService = async()=>
{
    const response = await getRejectedEventsRepository();
    return response;
}

export const approveEventsService = async(id , adminId )=>
{
    const response = await getEventByIdRepository(id);
    if(response.length == 0)
        throw new ApiError(404 , "Event not found");

    if(response[0].approval_status == "APPROVED")
            throw new ApiError(400 , "Already approved")

    const approveEvent = await approveEventsRepository(id , adminId);
    if(approveEvent[0].affectedRows == 0)
        throw new ApiError(500 , "Unable to approve event")

    return approveEvent;
}

export const rejectEventsService = async(id , reason)=>
{
    const response = await getEventByIdRepository(id);
    if(response.length == 0)
        throw new ApiError(404 , "Event not found");

    if(response.approval_status === "REJECTED")
        throw new ApiError(400, "Already rejected")

    const rejectEvent = await rejectEventsRepository(id , reason);
    if(rejectEvent[0].affectedRows == 0)
        throw new ApiError(500 , "Unable to reject event")

    return rejectEvent;
}