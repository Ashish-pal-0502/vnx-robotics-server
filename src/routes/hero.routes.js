import express from "express";
import {
   getUploadUrl,
   createHero,
   updateHero,
   deleteHero,
   getHeroById,
   getAllHeroes,
} from "../controllers/hero.controllers.js";

import { verifyJWT, isAdmin } from "../middlewares/user.middleware.js";

const router = express.Router();

// admin only routes

// upload video to s3 by getting pre-signed url from server
router.route("/upload-url").post(verifyJWT, isAdmin, getUploadUrl);

// create hero
router.route("/create").post(verifyJWT, isAdmin, createHero);

// update hero
router.route("/update/:id").put(verifyJWT, isAdmin, updateHero);

// delete hero
router.route("/delete/:id").delete(verifyJWT, isAdmin, deleteHero);

// public routes

// get all heroes
router.route("/get").get(getAllHeroes);

// get single hero
router.route("/get/:id").get(getHeroById);

export default router;
