import express from "express";

import { verifyJWT, isAdmin } from "../middlewares/user.middleware.js";
import {
   createCareer,
   deleteCareer,
   getAllCareers,
   getCareerById,
   updateCareer,
} from "../controllers/career.controllers.js";

const router = express.Router();

//create career
router.route("/create").post(verifyJWT, isAdmin, createCareer);
//get all blog
router.route("/get-all").get(getAllCareers);
//get blog by id
router.route("/get/:id").get(verifyJWT, isAdmin, getCareerById);
//update blog
router.route("/update/:id").put(verifyJWT, isAdmin, updateCareer);
//delete blog
router.route("/delete/:id").delete(deleteCareer);

export default router;
