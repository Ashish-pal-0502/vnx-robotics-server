import ApiError from "../middlewares/error.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Blog } from "../models/blog.model.js";
import { generateUploadURL, deleteFileFromS3 } from "../helpers/s3Helper.js";

// generate presigned URL for S3 upload
const getUploadUrl = asyncHandler(async (req, res, next) => {
   const { fileName, fileType } = req.body;
   if (!fileName || !fileType) {
      return next(
         new ApiError(
            StatusCodes.BAD_REQUEST,
            "fileName and fileType are required!"
         )
      );
   }
   const data = await generateUploadURL(fileName, fileType, "blogs");
   return res
      .status(StatusCodes.OK)
      .json(
         new ApiResponse(
            StatusCodes.OK,
            { data },
            "Upload URL generated successfully!"
         )
      );
});

//create blog
const createBlog = asyncHandler(async (req, res) => {
   const { heading, content, mtitle, mdesc, images } = req.body;
   if (!heading) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Heading is required!")
      );
   }
   if (!content) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Content is required!")
      );
   }
   if (!mtitle) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Meta title is required!")
      );
   }
   if (!mdesc) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Meta description is required!")
      );
   }
   if (!images || images.length === 0) {
      return next(
         new ApiError(
            StatusCodes.BAD_REQUEST,
            "At least one image is required!"
         )
      );
   }
   const blog = await Blog.create({
      heading,
      content,
      mtitle,
      mdesc,
      image: images,
      user: req.user?.id || "admin",
   });
   if (!blog) {
      return next(
         new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Blog creation failed!"
         )
      );
   }
   return res
      .status(StatusCodes.CREATED)
      .json(
         new ApiResponse(
            StatusCodes.CREATED,
            { blog },
            "Blog created successfully!"
         )
      );
});

//update blog
const updateBlog = asyncHandler(async (req, res) => {
   const blog = await Blog.findById(req.params.id);

   if (!blog) {
      return next(new ApiError(StatusCodes.NOT_FOUND, "Blog not found!"));
   }
   const { images } = req.body;
   if (images && images.length === 0) {
      return next(
         new ApiError(
            StatusCodes.BAD_REQUEST,
            "At least one image is required!"
         )
      );
   }
   // delete old images
   if (images) {
      for (let img of blog.image) {
         await deleteFileFromS3(img.key);
      }
      blog.image = images;
   }

   blog.heading = req.body.heading || blog.heading;
   blog.content = req.body.content || blog.content;
   await blog.save();
   return res
      .status(StatusCodes.OK)
      .json(
         new ApiResponse(StatusCodes.OK, { blog }, "Blog updated successfully!")
      );
});

const deleteBlog = asyncHandler(async (req, res) => {
   const blog = await Blog.findById(req.params.id);

   if (!blog) {
      return next(new ApiError(StatusCodes.NOT_FOUND, "Blog not found!"));
   }
   for (let img of blog.image) {
      await deleteFileFromS3(img.key);
   }
   await blog.deleteOne();
   return next(
      new ApiResponse(StatusCodes.OK, null, "Blog deleted successfully!")
   );
});

export { getUploadUrl, createBlog, updateBlog, deleteBlog };
