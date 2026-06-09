import { Router } from "express";
import {
   changePrivilege,
   deleteUser,
   forgotPassword,
   getMe,
   getUsers,
   googleLogin,
   loginUser,
   logoutUser,
   refreshAccessToken,
   registerUser,
   sendOTP,
   verifyUser,
} from "../controllers/user.controllers.js";
import {
   isAdmin,
   isLogout,
   verifyJWT,
} from "../middlewares/user.middleware.js";
import {
   loginLimiter,
   otpLimiter,
} from "../middlewares/rateLimit.middleware.js";
import { sendOtpOnMail } from "../helpers/email.helper.js";

const router = Router();
//routes
//register user
router.route("/register").post(otpLimiter, registerUser);
//login user
router.route("/login").post(isLogout, loginLimiter, loginUser);
//google login
router.route("/google-auth").post(loginLimiter, googleLogin);
//logout user
router.route("/logout").post(verifyJWT, logoutUser);
//verify user
router.route("/verify").post(isLogout, verifyUser);
router.route("/send-otp").post(isLogout, otpLimiter, sendOTP);
// forgot password
router.route("/forgot-password").post(isLogout, otpLimiter, forgotPassword);
//get logged in user details
router.route("/me").get(verifyJWT, getMe);
//refresh access token
router.route("/refresh-token").post(refreshAccessToken);

//only for admin
router.route("/get-users").get(verifyJWT, isAdmin, getUsers);
router.route("/delete-user/:id").delete(verifyJWT, isAdmin, deleteUser);
router
   .route("/change-privilege/:id")
   .patch(verifyJWT, isAdmin, changePrivilege);

export default router;
