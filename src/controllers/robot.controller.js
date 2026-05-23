import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Robot } from "../models/robot.model.js";
import { generateUploadURL, deleteFileFromS3 } from "../helpers/s3Helper.js";
import slugify from "slugify";
import { StatusCodes } from "http-status-codes";
import { validateFile } from "../validators/file.validation.js";

// generate presigned URL for S3 upload
const getUploadUrl = asyncHandler(async (req, res) => {
   const { fileName, fileType, size } = req.body;
   if (!fileName) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "fileName is required!");
   }
   if (!fileType) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "fileType is required!");
   }
   validateFile({ fileName, fileType, size });
   const data = await generateUploadURL(fileName, fileType, "robots");
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { data },
         message: "Upload URL generated successfully!",
      })
   );
});

// create robot
const createRobot = asyncHandler(async (req, res) => {
   const { name, description, images } = req.body;
   if (!name) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Robot name is required!");
   }
   if (!description) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Description is required!");
   }
   if (!images || images.length === 0) {
      throw new ApiError(
         StatusCodes.BAD_REQUEST,
         "At least one image is required!"
      );
   }
   const robot = await Robot.create({
      name,
      description,
      images,
      slug: `${slugify(name, {
         lower: true,
      })}-${Date.now()}`,
   });
   if (!robot) {
      throw new ApiError(
         StatusCodes.INTERNAL_SERVER_ERROR,
         "Robot creation failed!"
      );
   }
   return res.status(StatusCodes.CREATED).json(
      new ApiResponse({
         statusCode: StatusCodes.CREATED,
         data: { robot },
         message: "Robot created successfully!",
      })
   );
});

// update robot
const updateRobot = asyncHandler(async (req, res) => {
   const robot = await Robot.findById(req.params.id);
   if (!robot) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Robot not found!");
   }
   const { images } = req.body;
   if (images && images.length === 0) {
      throw new ApiError(
         StatusCodes.BAD_REQUEST,
         "At least one image is required!"
      );
   }
   const oldImages = robot.images;
   if (images?.length) {
      robot.images = images;
   }
   robot.name = req.body.name || robot.name;
   robot.description = req.body.description || robot.description;
   robot.slug = req.body.name
      ? `${slugify(req.body.name, {
           lower: true,
        })}-${Date.now()}`
      : robot.slug;
   await robot.save();
   // delete old images from S3
   if (images?.length) {
      for (const img of oldImages) {
         await deleteFileFromS3(img.key);
      }
   }
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { robot },
         message: "Robot updated successfully!",
      })
   );
});

// delete robot
const deleteRobot = asyncHandler(async (req, res) => {
   const robot = await Robot.findById(req.params.id);
   if (!robot) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Robot not found!");
   }
   // delete images from S3
   for (const img of robot.images) {
      await deleteFileFromS3(img.key);
   }
   await robot.deleteOne();
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: {},
         message: "Robot deleted successfully!",
      })
   );
});

// get robot by slug
const getRobotBySlug = asyncHandler(async (req, res) => {
   const { slug } = req.params;
   if (!slug) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Robot slug is required!");
   }
   const robot = await Robot.findOne({ slug });
   if (!robot) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Robot not found!");
   }
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { robot },
         message: "Robot fetched successfully!",
      })
   );
});

// get all robots
const getAllRobots = asyncHandler(async (req, res) => {
   let { page = 1, limit = 10, search = "" } = req.query;
   page = parseInt(page);
   limit = parseInt(limit);
   const query = {
      name: {
         $regex: search,
         $options: "i",
      },
   };
   const total = await Robot.countDocuments(query);
   const robots = await Robot.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: {
            robots,
            pagination: {
               total,
               page,
               pages: Math.ceil(total / limit),
            },
         },
         message: "Robots fetched successfully!",
      })
   );
});

export {
   getUploadUrl,
   createRobot,
   updateRobot,
   deleteRobot,
   getRobotBySlug,
   getAllRobots,
};
