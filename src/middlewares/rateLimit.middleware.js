import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "../utils/ApiResponse.js";


// Rate limiter for login attempts
export const loginLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 15, // max 5 requests
   standardHeaders: true,
   legacyHeaders: false,
   handler: (req, res) => {
      return res.status(StatusCodes.TOO_MANY_REQUESTS).json(
         ApiResponse.error({
            statusCode: StatusCodes.TOO_MANY_REQUESTS,
            message:
               "Too many login attempts. Please try again after 15 minutes.",
         })
      );
   },
});

// Rate limiter for OTP requests
export const otpLimiter = rateLimit({
   windowMs: 10 * 60 * 1000,
   max: 10,
   handler: (req, res) => {
      return res.status(429).json(
         ApiResponse.error({
            statusCode: 429,
            message: "Too many OTP requests. Try again later.",
         })
      );
   },
});
