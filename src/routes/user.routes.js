import { Router } from "express";
import {
   changePrivilege,
   deleteUser,
   forgotPassword,
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
import { sendOtpOnMail } from "../helpers/email.helper.js";

const router = Router();
//routes
//register user
router.route("/register").post(registerUser);
//login user
router.route("/login").post(isLogout, loginUser);
//google login
router.route("/google-auth").post(googleLogin);
//logout user
router.route("/logout").post(verifyJWT, logoutUser);
//verify user
router.route("/verify").post(verifyUser);
router.route("/send-otp").post(isLogout, sendOTP);
// forgot password
router.route("/forgot-password").post(isLogout, forgotPassword);
//refresh access token
router.route("/refresh-token").post(refreshAccessToken);

//only for admin
router.route("/get-users").get(verifyJWT, isAdmin, getUsers);
router.route("/delete-user/:id").delete(verifyJWT, isAdmin, deleteUser);
router
   .route("/change-privilege/:id")
   .patch(verifyJWT, isAdmin, changePrivilege);

export default router;
