import { s3 } from "../config/s3.config.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Generate Pre-Signed URL
export const generateUploadURL = async (
   fileName,
   fileType,
   folder = "uploads"
) => {
   const key = `${folder}/${uuidv4()}-${fileName}`;

   const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
   });

   const uploadURL = await getSignedUrl(s3, command, {
      expiresIn: 300,
   });

   const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

   return {
      uploadURL,
      key,
      fileUrl,
   };
};

// Delete File
export const deleteFileFromS3 = async (key) => {
   const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
   });

   await s3.send(command);
};
