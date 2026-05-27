import express from "express";
import {
   getUploadUrl,
   createRobot,
   updateRobot,
   deleteRobot,
   getRobotBySlug,
   getAllRobots,
} from "../controllers/robot.controller.js";
import { isAdmin, verifyJWT } from "../middlewares/user.middleware.js";
const router = express.Router();

// admin only routes
// upload image to s3 by getting pre-signed url from server
router.route("/upload-url").post(verifyJWT, isAdmin, getUploadUrl);
// create robot
router.route("/create").post(verifyJWT, isAdmin, createRobot);
// update robot
router.route("/update/:id").put(verifyJWT, isAdmin, updateRobot);
// delete robot
router.route("/delete/:id").delete(verifyJWT, isAdmin, deleteRobot);
// public routes
// get all robots
router.route("/get").get(getAllRobots);
// get robot by slug
router.route("/get/:slug").get(getRobotBySlug);

export default router;
