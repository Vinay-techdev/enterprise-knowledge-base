export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}]`, err);

  let status = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";

  if (err.name === "MulterError") {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "File size must not exceed 10 MB" : "Invalid file upload";
  } else if (message.includes("Only PDF")) {
    status = 400;
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((item) => item.message).join(", ");
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid resource identifier";
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "value";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === "production" ? "Internal server error" : message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};
