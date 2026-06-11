import {
  approveEventsService,
  approveRoleRequestService,
  getAllEventsService,
  getAllRoleRequestsService,
  getApprovedEventsService,
  getPendingEventsService,
  getRejectedEventsService,
  rejectEventsService,
  rejectRoleRequestService,
  revokeRoleRequestService,
} from "./admin.service.js";

export const getAllEventsController = async (req, res, next) => {
  try {
    const response = await getAllEventsService();
    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingEventsController = async (req, res, next) => {
  try {
    const response = await getPendingEventsService();
    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    next(error);
  }
};

export const getApprovedEventsController = async (req, res, next) => {
  try {
    const response = await getApprovedEventsService();
    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    next(error);
  }
};

export const getRejectedEventsController = async (req, res, next) => {
  try {
    const response = await getRejectedEventsService();
    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    next(error);
  }
};

export const approveEventsController = async (req, res, next) => {
  try {
    const response = await approveEventsService(req.params.id, req.user.id);
    return res.status(200).json({
      success: true,
      message: "Event approved",
    });
  } catch (err) {
    next(err);
  }
};

export const rejectEventsController = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const response = await rejectEventsService(
      req.params.id,
      req.body.reason,
      adminId,
    );
    return res.status(200).json({
      success: true,
      message: "Event rejected",
    });
  } catch (err) {
    next(err);
  }
};

export const getAllRoleRequestsController = async (req, res, next) => {
  try {
    const data = await getAllRoleRequestsService();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const approveRoleRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const data = await approveRoleRequestService(id, adminId);
    return res.status(200).json({
      success: true,
      message: "Role request approved. User promoted to ORGANIZER.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRoleRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { reason } = req.body;
    const data = await rejectRoleRequestService(id, adminId, reason);
    return res.status(200).json({
      success: true,
      message: "Role request rejected.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const revokeRoleRequestController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const data = await revokeRoleRequestService(id, adminId);
    return res.status(200).json({
      success: true,
      message: "Organizer role revoked. User downgraded to USER.",
      data,
    });
  } catch (error) {
    next(error);
  }
};
