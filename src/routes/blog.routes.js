import express from "express";
import {
   getUploadUrl,
   createBlog,
   updateBlog,
   deleteBlog,
} from "../controllers/blog.controllers.js";

const router = express.Router();

// presigned URL
router.route("/upload-url").post(getUploadUrl);

router.route("/").post(createBlog);
router.route("/:id").put(updateBlog);
router.route("/:id").delete(deleteBlog);

export default router;
