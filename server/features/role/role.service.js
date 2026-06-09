import { randomUUID } from "crypto";
import ApiError from "../../utils/ApiError.js";
import {
  createRoleRequestRepository,
  getRoleRequestByUserRepository,
} from "./role.repostiory.js";

export const createRoleRequestService = async (userId, reason) => {
  const existing = await getRoleRequestByUserRepository(userId);

  if (existing.length > 0) {
    throw new ApiError(400, "You already have a role request pending");
  }

  const requestId = randomUUID();
  const result = await createRoleRequestRepository(
    requestId,
    userId,
    reason || "Requested organizer role"
  );

  if (result.affectedRows === 0) {
    throw new ApiError(500, "Failed to create role request");
  }

  return {
    id: requestId,
    userId,
    reason: reason || "Requested organizer role",
    status: "PENDING",
  };
};

export const checkRoleRequestStatusService = async (userId) => {
  const result = await getRoleRequestByUserRepository(userId);

  if (result.length === 0) {
    return null;
  }

  return result[0];
};