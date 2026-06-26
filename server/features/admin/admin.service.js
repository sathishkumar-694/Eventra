import ApiError from "../../utils/ApiError.js";
import {
  approveEventsRepository,
  getAllEventsRepository,
  getAllPendingEventsRepository,
  getAllPendingRoleRequestsRepository,
  getApprovedEventsRepository,
  getEventByIdRepository,
  getRejectedEventsRepository,
  rejectEventsRepository,
  updateRoleRequestStatusRepository,
  updateUserRoleRepository,
  getStatsRepository,
} from "./admin.repository.js";
import { getRoleRequestByIdRepository } from "../role/role.repository.js";
import { findUserById } from "../auth/auth.repository.js";
import { emailQueue } from "../../queues/email.queue.js";

export const getAllEventsService = async () => {
  const response = await getAllEventsRepository();
  return response;
};

export const getPendingEventsService = async () => {
  const response = await getAllPendingEventsRepository();
  return response;
};

export const getApprovedEventsService = async () => {
  const response = await getApprovedEventsRepository();
  return response;
};

export const getRejectedEventsService = async () => {
  const response = await getRejectedEventsRepository();
  return response;
};

export const approveEventsService = async (id, adminId) => {
  const response = await getEventByIdRepository(id);
  if (response.length == 0) throw new ApiError(404, "Event not found");

  if (response[0].approval_status == "APPROVED")
    throw new ApiError(400, "Already approved");

  const approveEvent = await approveEventsRepository(id, adminId);
  if (approveEvent.affectedRows == 0)
    throw new ApiError(500, "Unable to approve event");

  findUserById(response[0].organizer_id)
    .then((organizer) => {
      if (organizer) {
        emailQueue.add(`event-approve-${id}`, {
          type: "event-status",
          to: organizer.email,
          payload: {
            organizerName: organizer.username,
            eventTitle: response[0].title,
            status: "APPROVED",
            reason: "",
          },
        }).catch(err => console.error(`Failed to enqueue event approval email: ${err.message}`));
      }
    })
    .catch((err) => console.error(`Failed to fetch organizer: ${err.message}`));

  return approveEvent;
};

export const rejectEventsService = async (id, reason, adminId) => {
  const response = await getEventByIdRepository(id);
  if (response.length == 0) throw new ApiError(404, "Event not found");

  if (response[0].approval_status === "REJECTED")
    throw new ApiError(400, "Already rejected");

  const rejectEvent = await rejectEventsRepository(id, reason, adminId);
  if (rejectEvent.affectedRows == 0)
    throw new ApiError(500, "Unable to reject event");

  findUserById(response[0].organizer_id)
    .then((organizer) => {
      if (organizer) {
        emailQueue.add(`event-reject-${id}`, {
          type: "event-status",
          to: organizer.email,
          payload: {
            organizerName: organizer.username,
            eventTitle: response[0].title,
            status: "REJECTED",
            reason,
          },
        }).catch(err => console.error(`Failed to enqueue event rejection email: ${err.message}`));
      }
    })
    .catch((err) => console.error(`Failed to fetch organizer: ${err.message}`));

  return rejectEvent;
};

export const getAllRoleRequestsService = async () => {
  return await getAllPendingRoleRequestsRepository();
};

export const approveRoleRequestService = async (requestId, adminId) => {
  const rows = await getRoleRequestByIdRepository(requestId);
  if (rows.length === 0) throw new ApiError(404, "Role request not found");

  const request = rows[0];
  if (request.status !== "PENDING")
    throw new ApiError(400, `Role request is already ${request.status}`);

  const statusResult = await updateRoleRequestStatusRepository(requestId, "APPROVED", adminId);
  if (statusResult.affectedRows === 0)
    throw new ApiError(500, "Failed to update role request status");

  const roleResult = await updateUserRoleRepository(request.user_id, "ORGANIZER");
  if (roleResult.affectedRows === 0)
    throw new ApiError(500, "Failed to update user role");

  findUserById(request.user_id)
    .then((user) => {
      if (user) {
        emailQueue.add(`role-approve-${requestId}`, {
          type: "role-status",
          to: user.email,
          payload: {
            username: user.username,
            status: "APPROVED",
            reason: "",
          },
        }).catch(err => console.error(`Failed to enqueue role approval email: ${err.message}`));
      }
    })
    .catch((err) => console.error(`Failed to fetch user: ${err.message}`));

  return { requestId, userId: request.user_id, newRole: "ORGANIZER" };
};

export const rejectRoleRequestService = async (requestId, adminId, reason) => {
  const rows = await getRoleRequestByIdRepository(requestId);
  if (rows.length === 0) 
    throw new ApiError(404, "Role request not found");

  const request = rows[0];
  if (request.status !== "PENDING")
    throw new ApiError(400, `Role request is already ${request.status}`);

  const statusResult = await updateRoleRequestStatusRepository(requestId, "REJECTED", adminId, reason);
  if (statusResult.affectedRows === 0)
    throw new ApiError(500, "Failed to update role request status");

  findUserById(request.user_id)
    .then((user) => {
      if (user) {
        emailQueue.add(`role-reject-${requestId}`, {
          type: "role-status",
          to: user.email,
          payload: {
            username: user.username,
            status: "REJECTED",
            reason,
          },
        }).catch(err => console.error(`Failed to enqueue role rejection email: ${err.message}`));
      }
    })
    .catch((err) => console.error(`Failed to fetch user: ${err.message}`));

  return { requestId, userId: request.user_id, status: "REJECTED" };
};

export const revokeRoleRequestService = async (requestId, adminId) => {
  const rows = await getRoleRequestByIdRepository(requestId);
  if (rows.length === 0)
    throw new ApiError(404, "Role request not found");

  const request = rows[0];
  if (request.status !== "APPROVED")
    throw new ApiError(400, `Cannot revoke a request with status: ${request.status}`);

  const statusResult = await updateRoleRequestStatusRepository(requestId, "REVOKED", adminId);
  if (statusResult.affectedRows === 0)
    throw new ApiError(500, "Failed to revoke role request");

  const roleResult = await updateUserRoleRepository(request.user_id, "USER");
  if (roleResult.affectedRows === 0)
    throw new ApiError(500, "Failed to downgrade user role");

  return { requestId, userId: request.user_id, role: "USER" };
};

export const getStatsService = async () => {
  return await getStatsRepository();
};
