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
   const {
      name,
      description,
      category,
      specifications,
      keyPoints,
      applications,
      images,
      video,
      is_development, // added is_development field
   } = req.body;

   // Validation
   if (!name) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Robot name is required!");
   }
   if (!description) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Description is required!");
   }
   if (!category) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Category is required!");
   }
   if (!images || images.length === 0) {
      throw new ApiError(
         StatusCodes.BAD_REQUEST,
         "At least one image is required!"
      );
   }

   // Validate specifications if provided
   if (specifications && specifications.length > 0) {
      for (const spec of specifications) {
         if (!spec.label || !spec.value) {
            throw new ApiError(
               StatusCodes.BAD_REQUEST,
               "Each specification must have both label and value!"
            );
         }
      }
   }

   // Validate video if provided
   if (video) {
      if (!video.url && !video.key) {
         throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Video must have either url or key!"
         );
      }
   }

   const robot = await Robot.create({
      name,
      description,
      category,
      specifications: specifications || [],
      keyPoints: keyPoints || [],
      applications: applications || [],
      images,
      video: video || { url: null, key: null },
      is_development: is_development !== undefined ? is_development : false, // set is_development with default false
      slug: `${slugify(name, {
         lower: true,
         strict: true,
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
   const {
      name,
      description,
      category,
      specifications,
      keyPoints,
      applications,
      images,
      video,
      is_development, // added is_development field
   } = req.body;

   // Validate images
   if (images && images.length === 0) {
      throw new ApiError(
         StatusCodes.BAD_REQUEST,
         "At least one image is required!"
      );
   }

   // Validate specifications if provided
   if (specifications && specifications.length > 0) {
      for (const spec of specifications) {
         if (!spec.label || !spec.value) {
            throw new ApiError(
               StatusCodes.BAD_REQUEST,
               "Each specification must have both label and value!"
            );
         }
      }
   }

   // Validate video if provided
   if (video) {
      if (!video.url && !video.key) {
         throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Video must have either url or key!"
         );
      }
   }

   // Handle image deletion from S3
   const oldImages = robot.images || [];
   const newImages = images || oldImages;
   const removedImages = oldImages.filter(
      (oldImg) => !newImages.some((newImg) => newImg.key === oldImg.key)
   );

   for (const img of removedImages) {
      if (img.key) {
         await deleteFileFromS3(img.key);
      }
   }

   // Handle video deletion from S3 if video key is being removed/updated
   if (video && robot.video && robot.video.key) {
      const isVideoRemoved = !video.key || video.key !== robot.video.key;
      if (isVideoRemoved && robot.video.key) {
         await deleteFileFromS3(robot.video.key);
      }
   }

   // Update fields
   robot.images = newImages;
   robot.name = name || robot.name;
   robot.description = description || robot.description;
   robot.category = category || robot.category;
   robot.specifications = specifications || robot.specifications;
   robot.keyPoints = keyPoints || robot.keyPoints;
   robot.applications = applications || robot.applications;

   // Update is_development field (only if provided, otherwise keep existing)
   if (is_development !== undefined) {
      robot.is_development = is_development;
   }

   // Update video field (only if provided, otherwise keep existing)
   if (video !== undefined) {
      robot.video = video;
   }

   // Update slug if name changed
   if (name && name !== robot.name) {
      robot.slug = `${slugify(name, {
         lower: true,
         strict: true,
      })}-${Date.now()}`;
   }

   await robot.save();

   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { robot },
         message: "Robot updated successfully!",
      })
   );
});

// delete robot (updated to handle video deletion)
const deleteRobot = asyncHandler(async (req, res) => {
   const robot = await Robot.findById(req.params.id);
   if (!robot) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Robot not found!");
   }

   // Delete images from S3
   for (const img of robot.images) {
      if (img.key) {
         await deleteFileFromS3(img.key);
      }
   }

   // Delete video from S3 if it has a key
   if (robot.video && robot.video.key) {
      await deleteFileFromS3(robot.video.key);
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

// get robot by ID
const getRobotById = asyncHandler(async (req, res) => {
   const robot = await Robot.findById(req.params.id);
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

// get all robots (optionally filter by is_development)
// get all robots (show all robots, including development)
const getAllRobots = asyncHandler(async (req, res) => {
   let { page = 1, limit = 10, search = "", category, includeDevelopment } = req.query;
   page = parseInt(page);
   limit = parseInt(limit);

   const query = {};

   // Only filter out development robots if includeDevelopment is explicitly "false"
   // By default, show all robots (including development)
   if (includeDevelopment === "false") {
      query.is_development = { $ne: true };
   }

   // Search by name or description
   if (search) {
      query.$or = [
         { name: { $regex: search, $options: "i" } },
         { description: { $regex: search, $options: "i" } },
         { category: { $regex: search, $options: "i" } },
      ];
   }

   // Filter by category
   if (category) {
      query.category = { $regex: category, $options: "i" };
   }

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
               limit,
               pages: Math.ceil(total / limit),
            },
         },
         message: "Robots fetched successfully!",
      })
   );
});

// get all categories (for filtering)
const getAllCategories = asyncHandler(async (req, res) => {
   const categories = await Robot.distinct("category");

   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { categories },
         message: "Categories fetched successfully!",
      })
   );
});

export {
   getUploadUrl,
   createRobot,
   updateRobot,
   deleteRobot,
   getRobotBySlug,
   getRobotById,
   getAllRobots,
   getAllCategories,
};
