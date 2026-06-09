import {
  checkRoleRequestStatusService,
  createRoleRequestService,
} from "./role.service.js";

export const createRoleRequestController = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id;
    const data = await createRoleRequestService(userId, reason);

    return res.status(201).json({
      success: true,
      message: "Role request created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const checkRoleRequestController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await checkRoleRequestStatusService(userId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};