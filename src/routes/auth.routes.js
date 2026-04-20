import { Router } from "express";
import {
   loginUser,
   logoutUser,
   registerUser,
   verifyEmail,
} from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
//routes
//register user
router.route("/register").post(registerUser);
//login user
router.route("/login").post(loginUser);
//logout user
router.route("/logout").post(verifyJWT, logoutUser);
//verify email
router.route("/verify/:id").get(verifyEmail);
export default router;
