import jwt from "jsonwebtoken";

export const getOptionalMe = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header) {
      const token = header.split(" ")[1];
      if (token && token !== "undefined" && token !== "null") {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = decoded;
      }
    }
    next();
  } catch (error) {
    next();
  }
};
