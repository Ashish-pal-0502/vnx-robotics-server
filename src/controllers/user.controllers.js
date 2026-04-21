import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../middlewares/error.middleware.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { sendVerificationMail } from "../helpers/email.helper.js";

//generate access and refresh token
const generateAccessAndRefreshTokens = async (userId) => {
   const user = await User.findById(userId);
   const accessToken = user.generateAccessToken();
   const refreshToken = user.generateRefreshToken();
   user.refreshToken = refreshToken;
   await user.save({ validateBeforeSave: false });
   return { accessToken, refreshToken };
};

//cookie option
const options = {
   httpOnly: true,
   secure: true,
};

//register user
const registerUser = asyncHandler(async (req, res, next) => {
   const { name, email, password } = req.body;
   if (!name) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Name is required!"));
   }
   if (!email) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Email is required!"));
   }
   if (!password) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Password is required!")
      );
   }

   const user = await User.findOne({
      $or: [{ email }],
   });
   if (user) {
      return next(new ApiError(StatusCodes.CONFLICT, "User already exist!"));
   }

   const newUser = await User.create({
      name,
      email,
      password,
   });
   const createdUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
   );

   if (!createdUser) {
      return next(
         new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Something went wrong!"
         )
      );
   }
   sendVerificationMail(name, email, createdUser._id);
   return res
      .status(StatusCodes.CREATED)
      .json(
         new ApiResponse(
            StatusCodes.CREATED,
            createdUser,
            "Registration successfull! Please check your email to verify your account!"
         )
      );
});

//login user
const loginUser = asyncHandler(async (req, res, next) => {
   const { email, password } = req.body;
   if (!email) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Email is required!"));
   }
   if (!password) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Password is required!")
      );
   }
   const user = await User.findOne({
      $or: [{ email }],
   });
   if (!user) {
      return next(
         new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials!")
      );
   }
   const isPasswordCorrect = await user.isPasswordCorrect(password);
   if (!isPasswordCorrect) {
      return next(
         new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials!")
      );
   }
   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
   );
   const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );
   return res
      .status(StatusCodes.OK)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            StatusCodes.OK,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully!"
         )
      );
});

//logout user
const logoutUser = asyncHandler(async (req, res, next) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshToken: undefined || "",
         },
      },
      {
         new: true,
      }
   );
   return res
      .status(StatusCodes.OK)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(StatusCodes.OK, {}, "User logged out!"));
});

//verify email
const verifyEmail = asyncHandler(async (req, res, next) => {
   const { id } = req.params;
   const user = await User.findById({ _id: id });
   if (user.is_verified) {
      return next(
         new ApiError(StatusCodes.CONFLICT, "Email already verified!")
      );
   }
   await User.updateOne({ _id: id }, { $set: { is_verified: 1 } });
   return res
      .status(StatusCodes.OK)
      .json(
         new ApiResponse(StatusCodes.OK, {}, "Email verified successfully!")
      );
});
export { registerUser, loginUser, logoutUser, verifyEmail };
