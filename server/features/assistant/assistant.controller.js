import { generateAssistantReply } from "./assistant.service.js";

export const chatAssistantController = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user ? req.user.id : null;
    const reply = await generateAssistantReply(message, userId);
    return res.status(200).json({ success: true, reply });
  } catch (error) {
    next(error);
  }
};
