import { Router } from "express";
import {
   changePrivilege,
   deleteUser,
   getUsers,
   googleLogin,
   loginUser,
   logoutUser,
   registerUser,
   verifyEmail,
} from "../controllers/user.controllers.js";
import {
   isAdmin,
   isLogout,
   verifyJWT,
} from "../middlewares/user.middleware.js";

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
//verify email
router.route("/verify/:accessToken").post(verifyEmail);

//only for admin
router.route("/get-users").get(verifyJWT, isAdmin, getUsers);
router.route("/delete-user/:id").delete(verifyJWT, isAdmin, deleteUser);
router
   .route("/change-privilege/:id")
   .patch(verifyJWT, isAdmin, changePrivilege);

export default router;
