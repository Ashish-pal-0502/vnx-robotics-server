import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Hero } from "../models/hero.model.js";
import { StatusCodes } from "http-status-codes";
import { generateUploadURL, deleteFileFromS3 } from "../helpers/s3Helper.js";
import { validateFile } from "../validators/file.validation.js";

// Generate presigned URL for S3 upload
const getUploadUrl = asyncHandler(async (req, res) => {
   const { fileName, fileType, size } = req.body;
   if (!fileName) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "fileName is required!");
   }
   if (!fileType) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "fileType is required!");
   }
   validateFile({ fileName, fileType, size });
   const data = await generateUploadURL(fileName, fileType, "hero-videos");
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { data },
         message: "Upload URL generated successfully!",
      })
   );
});

const createHero = asyncHandler(async (req, res) => {
   const { desktopVideo, mobileVideo } = req.body;
   if (!desktopVideo?.url || !desktopVideo?.key) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Desktop video is required!");
   }
   if (!mobileVideo?.url || !mobileVideo?.key) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Mobile video is required!");
   }
   let hero = await Hero.findOne();
   // Update existing hero
   if (hero) {
      if (
         hero.desktopVideo?.key &&
         hero.desktopVideo.key !== desktopVideo.key
      ) {
         await deleteFileFromS3(hero.desktopVideo.key);
      }
      if (hero.mobileVideo?.key && hero.mobileVideo.key !== mobileVideo.key) {
         await deleteFileFromS3(hero.mobileVideo.key);
      }
      hero.desktopVideo = desktopVideo;
      hero.mobileVideo = mobileVideo;
      await hero.save();
      return res.status(StatusCodes.OK).json(
         new ApiResponse({
            statusCode: StatusCodes.OK,
            data: { hero },
            message: "Hero updated successfully!",
         })
      );
   }
   // Create first hero
   hero = await Hero.create({
      desktopVideo,
      mobileVideo,
   });
   return res.status(StatusCodes.CREATED).json(
      new ApiResponse({
         statusCode: StatusCodes.CREATED,
         data: { hero },
         message: "Hero created successfully!",
      })
   );
});

// Get All Heroes
const getAllHeroes = asyncHandler(async (req, res) => {
   const heroes = await Hero.find().sort({ createdAt: -1 });
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: {
            count: heroes.length,
            data: heroes,
         },
         message: "Heroes fetched successfully!",
      })
   );
});

// Get Single Hero
const getHeroById = asyncHandler(async (req, res) => {
   const hero = await Hero.findById(req.params.id);
   if (!hero) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Hero not found!");
   }
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { hero },
         message: "Hero fetched successfully!",
      })
   );
});

// Update Hero
const updateHero = asyncHandler(async (req, res) => {
   const { desktopVideo, mobileVideo } = req.body;
   const hero = await Hero.findById(req.params.id);
   if (!hero) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Hero not found!");
   }
   if (desktopVideo) {
      if (hero.desktopVideo?.key) {
         await deleteFileFromS3(hero.desktopVideo.key);
      }
      hero.desktopVideo = desktopVideo;
   }
   if (mobileVideo) {
      if (hero.mobileVideo?.key) {
         await deleteFileFromS3(hero.mobileVideo.key);
      }
      hero.mobileVideo = mobileVideo;
   }
   await hero.save();
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { hero },
         message: "Hero updated successfully!",
      })
   );
});

// Delete Hero
const deleteHero = asyncHandler(async (req, res) => {
   const hero = await Hero.findById(req.params.id);
   if (!hero) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Hero not found!");
   }
   if (hero.desktopVideo?.key) {
      await deleteFileFromS3(hero.desktopVideo.key);
   }
   if (hero.mobileVideo?.key) {
      await deleteFileFromS3(hero.mobileVideo.key);
   }
   await hero.deleteOne();
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: {},
         message: "Hero deleted successfully!",
      })
   );
});

export {
   getUploadUrl,
   createHero,
   getAllHeroes,
   getHeroById,
   updateHero,
   deleteHero,
};
