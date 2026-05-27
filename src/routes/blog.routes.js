import express from "express";
import {
   getUploadUrl,
   createBlog,
   updateBlog,
   deleteBlog,
   getBlogBySlug,
   getAllBlogs,
} from "../controllers/blog.controllers.js";
import { isAdmin, verifyJWT } from "../middlewares/user.middleware.js";

const router = express.Router();

//admin only routes
// upload image to s3 by getting pre-signed url from server
router.route("/upload-url").post(verifyJWT, isAdmin, getUploadUrl);
//create blog
router.route("/create").post(verifyJWT, isAdmin, createBlog);
//update blog
router.route("/update/:id").put(verifyJWT, isAdmin, updateBlog);
//delete blog
router.route("/delete/:id").delete(verifyJWT, isAdmin, deleteBlog);
//get blog by slug - public route
//public route
router.route("/get").get(getAllBlogs);
router.route("/get/:slug").get(getBlogBySlug);

export default router;
