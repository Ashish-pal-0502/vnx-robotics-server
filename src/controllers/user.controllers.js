import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../middlewares/error.middleware.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";
import { sendVerificationMail } from "../helpers/email.helper.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

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
   const { name, email } = req.body;
   if (!name) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Name is required!"));
   }
   if (!email) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Email is required!"));
   }
   const user = await User.findOne({
      $or: [{ email }],
   });
   if (user) {
      return next(new ApiError(StatusCodes.CONFLICT, "User already exist!"));
   }
   const mail = await sendVerificationMail(name, email);
   if (!mail) {
      return next(
         new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Something went wrong while sending verification email!"
         )
      );
   }
   return res
      .status(StatusCodes.CREATED)
      .json(
         new ApiResponse(
            StatusCodes.CREATED,
            {},
            "Registration successfull! Please check your email to verify your account!"
         )
      );
});

//verify email
const verifyEmail = asyncHandler(async (req, res, next) => {
   const { password } = req.body;
   if (!password) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Password is required!")
      );
   }
   const { accessToken } = req.params;
   if (!accessToken) {
      return next(
         new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Something went wrong!"
         )
      );
   }
   const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
   const { name, email } = decoded;
   const user = await User.findOne({
      $or: [{ email }],
   });
   if (user) {
      return next(new ApiError(StatusCodes.CONFLICT, "User already verified!"));
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
   return res
      .status(StatusCodes.OK)
      .json(
         new ApiResponse(
            StatusCodes.OK,
            { createdUser },
            "User verified successfully!"
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

//google login
const googleLogin = asyncHandler(async (req, res, next) => {
   const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
   const { tokenId } = req.body;
   if (!tokenId) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Token ID is required!")
      );
   }
   const ticket = await client.verifyIdToken({
      idToken: tokenId,
   });
   const payload = ticket.getPayload();
   const { email, name } = payload;
   let user = await User.findOne({ email });
   if (!user) {
      user = await User.create({
         name,
         email,
         password: email + process.env.GOOGLE_CLIENT_ID,
      });
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

//for admin only
//get users
const getUsers = asyncHandler(async (req, res, next) => {
   let search = "";
   if (req.query.search) {
      search = req.query.search;
   }
   let page = 1;
   if (req.query.page) {
      page = req.query.page;
   }
   const limit = 6;
   const users = await User.find({
      __v: 0,
      $or: [
         { name: { $regex: ".*" + search + ".*", $options: "i" } },
         { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
   })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
   const count = await User.find({
      __v: 0,
      $or: [
         { name: { $regex: ".*" + search + ".*", $options: "i" } },
         { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
   }).countDocuments();
   return res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, {
         users,
         totalPages: Math.ceil(count / limit),
         currentPage: page,
      })
   );
});

//change privilege
const changePrivilege = asyncHandler(async (req, res, next) => {
   const { value } = req.body;
   const { id } = req.params;
   const user = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { is_admin: value } },
      { new: true }
   ).select("-password -refreshToken");
   if (!user) {
      return next(
         new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Error while changing user privilege!"
         )
      );
   }
   return res
      .status(StatusCodes.OK)
      .json(
         new ApiResponse(
            StatusCodes.OK,
            user,
            "Changed user privilege successfully."
         )
      );
});

//delete user
const deleteUser = asyncHandler(async (req, res, next) => {
   const { id } = req.params;
   await User.deleteOne({ _id: id });
   return res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, {}, "User deleted!"));
});

export {
   registerUser,
   loginUser,
   logoutUser,
   changePrivilege,
   verifyEmail,
   googleLogin,
   getUsers,
   deleteUser,
};
