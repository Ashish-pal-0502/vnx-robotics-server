import { ApiResponse } from "../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

const errorMiddleware = (err, req, res, next) => {
   let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
   let message = err.message || "Internal Server Error";
   let errors = err.errors || null;

   //Mongoose Errors
   if (err.name === "CastError") {
      statusCode = StatusCodes.BAD_REQUEST;
      message = "Invalid ID format";
   }

   if (err.code === 11000) {
      statusCode = StatusCodes.BAD_REQUEST;
      message = `Duplicate field value entered`;
   }

   if (err.name === "ValidationError") {
      statusCode = StatusCodes.BAD_REQUEST;
      errors = Object.values(err.errors).map((val) => val.message);
   }

   //JWT Errors
   if (err.name === "JsonWebTokenError") {
      statusCode = StatusCodes.UNAUTHORIZED;
      message = "Invalid token";
   }

   if (err.name === "TokenExpiredError") {
      statusCode = StatusCodes.UNAUTHORIZED;
      message = "Token expired";
   }

   return res.status(statusCode).json(
      ApiResponse.error({
         statusCode,
         message,
         errors,
      })
   );
};

export default errorMiddleware;
