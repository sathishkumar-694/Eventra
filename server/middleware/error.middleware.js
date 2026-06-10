const errorMiddleware = (err, req, res, next) => {
  const isDevMode = process.env.NODE_ENV === "dev"
  const statusCode = err.statusCode || 500;
  const msg = err.message || "Internal Server Error"
  return res.status(statusCode).json({
      message: msg ,
      success: false,
      errors : isDevMode ? err.errors : undefined,
      stack : isDevMode ? err.stack : undefined
  });
};

export default errorMiddleware;
