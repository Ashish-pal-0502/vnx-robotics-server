import express from "express";
import {
   createJob,
   getJobs,
   getJobBySlug,
   updateJob,
   deleteJob,
   toggleJobStatus,
   jobStats,
} from "../controllers/career.controllers.js";

import { verifyJWT, isAdmin } from "../middlewares/user.middleware.js";

const router = express.Router();

// create job (admin)
router.route("/create").post(verifyJWT, isAdmin, createJob);
// get all jobs (public)
router.route("/get").get(getJobs);
// get single job (public - using slug)
router.route("/get/:slug").get(getJobBySlug);
// update job (admin)
router.route("/update/:id").put(verifyJWT, isAdmin, updateJob);
// delete job (admin)
router.route("/delete/:id").delete(verifyJWT, isAdmin, deleteJob);
// toggle active/inactive (admin)
router.route("/toggle/:id").patch(verifyJWT, isAdmin, toggleJobStatus);
// stats (admin dashboard)
router.route("/stats").get(verifyJWT, isAdmin, jobStats);

export default router;
