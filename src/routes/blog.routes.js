import express from "express";
import {
   getUploadUrl,
   createBlog,
   updateBlog,
   deleteBlog,
   getBlogById,
   getAllBlogs,
} from "../controllers/blog.controllers.js";
import { isAdmin, verifyJWT } from "../middlewares/user.middleware.js";

const router = express.Router();

// presigned URL
router.route("/upload-url").post(verifyJWT, isAdmin, getUploadUrl);

router.route("/create").post(verifyJWT, isAdmin, createBlog);
router.route("/update/:id").put(verifyJWT, isAdmin, updateBlog);
router.route("/delete/:id").delete(verifyJWT, isAdmin, deleteBlog);
router.route("/get/:id").get(verifyJWT, isAdmin, getBlogById);
router.route("/get").get(getAllBlogs);

export default router;
