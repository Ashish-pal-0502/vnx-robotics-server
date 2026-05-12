import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Career } from "../models/career.model.js";
import { StatusCodes } from "http-status-codes";

// Crate career
const createCareer = asyncHandler(async (req, res) => {
   const { title, description, applyLink } = req.body;
   if (!title) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Title is required!");
   }
   if (!description) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Description is required!");
   }
   if (!applyLink) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Appy link is required!");
   }
   const career = await Career.create({
      title,
      description,
      applyLink,
      postedBy: req.user?._id,
   });
   return res.status(StatusCodes.CREATED).json(
      new ApiResponse({
         statusCode: StatusCodes.CREATED,
         data: { career },
         message: "Career created sucessfully!",
      })
   );
});

//Get all careers
const getAllCareers = asyncHandler(async (req, res) => {
   const careers = await Career.find()
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 });

   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { count: careers.length, data: careers },
         message: "Career found sucessfully!",
      })
   );
});

//Get single career
const getCareerById = async (req, res, next) => {
   const career = await Career.findById(req.params.id).populate(
      "postedBy",
      "name email"
   );
   if (!career) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Career not found");
   }
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { career },
         message: "Career created sucessfully!",
      })
   );
};

//Update career
const updateCareer = async (req, res, next) => {
   const { title, description, applyLink } = req.body;
   const career = await Career.findById(req.params.id);
   if (!career) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Career not found!");
   }
   career.title = title || career.title;
   career.description = description || career.description;
   career.applyLink = applyLink || career.applyLink;
   await career.save();
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: {},
         message: "Career updated successfully!",
      })
   );
};

// Delete career
const deleteCareer = asyncHandler(async (req, res, next) => {
   const career = await Career.findById(req.params.id);
   if (!career) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Career not found!");
   }
   await career.deleteOne();
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: {},
         message: "Career deleted successfully",
      })
   );
});

export {
   createCareer,
   getAllCareers,
   getCareerById,
   updateCareer,
   deleteCareer,
};
