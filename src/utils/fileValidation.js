import path from "path";
import ApiError from "../middlewares/error.middleware.js";

const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
const allowedExt = [".png", ".jpg", ".jpeg", ".webp"];

const MIN_SIZE = 30 * 1024; // 30KB
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export const validateFile = ({ fileName, fileType, size }) => {
   const ext = path.extname(fileName).toLowerCase();
   // type + extension validation
   if (!allowedTypes.includes(fileType) || !allowedExt.includes(ext)) {
      throw new ApiError(400, "Invalid file type");
   }
   // size validation
   if (size < MIN_SIZE) {
      throw new ApiError(400, "File size too small (min 30KB)");
   }
   if (size > MAX_SIZE) {
      throw new ApiError(400, "File size too large (max 2MB)");
   }
};
