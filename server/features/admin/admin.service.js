import { getAllPendingEventsRepository } from "./admin.repository"

export const getPendingEventsService = async()=>
{
    const response = await getAllPendingEventsRepository();
}