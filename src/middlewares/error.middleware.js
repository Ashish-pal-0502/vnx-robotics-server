import { StatusCodes } from "http-status-codes";

class ApiError extends Error {
   constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
   }
}

export const errorMiddleware = (err, req, res, next) => {
   err.message = err.message || "Internal Server Error";
   err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
   const errorMessage = err.errors
      ? Object.values(err.errors)
           .map((error) => error.message)
           .join(" ")
      : err.message;

   return res.status(err.statusCode).json({
      success: false,
      message: errorMessage,
   });
};

export default ApiError;
