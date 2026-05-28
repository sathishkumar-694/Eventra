const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const msg = err.message || "Internal Server Error"
  return res.status(statusCode).json({
      message: msg ,
      success: false,
  });
};

export default errorMiddleware;
