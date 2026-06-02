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
//get all careers
router.route("/get-all").get(getAllCareers);
//get career by id
router.route("/get/:id").get(verifyJWT, isAdmin, getCareerById);
//update career
router.route("/update/:id").put(verifyJWT, isAdmin, updateCareer);
//delete career
router.route("/delete/:id").delete(verifyJWT, isAdmin, deleteCareer); // Added verifyJWT, isAdmin

export default router;
