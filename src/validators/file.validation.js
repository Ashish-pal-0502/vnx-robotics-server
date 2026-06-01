import path from "path";
import ApiError from "../utils/ApiError.js";

const allowedTypes = [
   // Images
   "image/png",
   "image/jpeg",
   "image/jpg",
   "image/webp",

   // Videos
   "video/mp4",
   "video/webm",
   "video/quicktime",
];

const allowedExt = [
   // Images
   ".png",
   ".jpg",
   ".jpeg",
   ".webp",

   // Videos
   ".mp4",
   ".webm",
   ".mov",
];

const MIN_SIZE = 30 * 1024; // 30KB
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export const validateFile = ({ fileName, fileType, size }) => {
   const ext = path.extname(fileName).toLowerCase();

   // Type + extension validation
   if (!allowedTypes.includes(fileType) || !allowedExt.includes(ext)) {
      throw new ApiError(400, "Invalid file type");
   }

   // Size validation
   if (size < MIN_SIZE) {
      throw new ApiError(400, "File size too small (min 30KB)");
   }

   if (size > MAX_SIZE) {
      throw new ApiError(400, "File size too large (max 100MB)");
   }
};
