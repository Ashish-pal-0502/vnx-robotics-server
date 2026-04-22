import { Router } from "express";
import {
   getUsers,
   googleLogin,
   loginUser,
   logoutUser,
   registerUser,
   verifyEmail,
} from "../controllers/user.controllers.js";
import { isAdmin, verifyJWT } from "../middlewares/user.middleware.js";

const router = Router();
//routes
//register user
router.route("/register").post(registerUser);
//login user
router.route("/login").post(loginUser);
//google login
router.route("/google-auth").post(googleLogin);
//logout user
router.route("/logout").post(verifyJWT, logoutUser);
//verify email
router.route("/verify/:accessToken").post(verifyEmail);

//only for admin
router.route("/get-users").get(verifyJWT, isAdmin, getUsers);
export default router;
