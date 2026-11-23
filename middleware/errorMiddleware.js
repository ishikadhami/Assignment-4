function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || res.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error.code === 11000) {
    statusCode = 409;
    message = "A user with this email already exists";
  } else if (error.name === "ValidationError" || error.name === "CastError") {
    statusCode = 400;
  } else if (error.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body contains invalid JSON";
  }

  res.status(statusCode).json({ message });
}

module.exports = { notFound, errorHandler };