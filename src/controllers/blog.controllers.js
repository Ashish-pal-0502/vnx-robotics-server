import ApiError from "../middlewares/error.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Blog } from "../models/blog.model.js";
import { generateUploadURL, deleteFileFromS3 } from "../helpers/s3Helper.js";
import slugify from "slugify";
import { StatusCodes } from "http-status-codes";
import { validateFile } from "../utils/fileValidation.js";

// generate presigned URL for S3 upload
const getUploadUrl = asyncHandler(async (req, res, next) => {
   const { fileName, fileType, size } = req.body;
   if (!fileName || !fileType) {
      return next(
         new ApiError(
            StatusCodes.BAD_REQUEST,
            "fileName and fileType are required!"
         )
      );
   }
   validateFile({ fileName, fileType, size });
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
const createBlog = asyncHandler(async (req, res, next) => {
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
      slug: `${slugify(heading, { lower: true })}-${Date.now()}`,
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
const updateBlog = asyncHandler(async (req, res, next) => {
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
   const oldImages = blog.image;
   if (images?.length) {
      blog.image = images;
   }
   await blog.save();
   for (const img of oldImages) {
      await deleteFileFromS3(img.key);
   }
   blog.heading = req.body.heading || blog.heading;
   blog.content = req.body.content || blog.content;
   blog.mtitle = req.body.mtitle || blog.mtitle;
   blog.mdesc = req.body.mdesc || blog.mdesc;
   blog.slug = slugify(blog.heading, { lower: true }) || blog.slug;
   await blog.save();
   return res
      .status(StatusCodes.OK)
      .json(
         new ApiResponse(StatusCodes.OK, { blog }, "Blog updated successfully!")
      );
});

//delete blog by id
const deleteBlog = asyncHandler(async (req, res, next) => {
   const blog = await Blog.findById(req.params.id);
   if (!blog) {
      return next(new ApiError(StatusCodes.NOT_FOUND, "Blog not found!"));
   }
   for (let img of blog.image) {
      await deleteFileFromS3(img.key);
   }
   await blog.deleteOne();
   return res
      .status(StatusCodes.OK)
      .json(
         new ApiResponse(StatusCodes.OK, null, "Blog deleted successfully!")
      );
});

//get blog by id
const getBlogById = asyncHandler(async (req, res, next) => {
   const { id } = req.params;
   if (!id) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Blog ID is required!")
      );
   }
   const blog = await Blog.findById(id);
   if (!blog) {
      return next(new ApiError(StatusCodes.NOT_FOUND, "Blog not found!"));
   }
   return res
      .status(StatusCodes.OK)
      .json(
         new ApiResponse(StatusCodes.OK, { blog }, "Blog fetched successfully!")
      );
});

//get all blogs
const getAllBlogs = asyncHandler(async (req, res, next) => {
   let { page = 1, limit = 10, search = "" } = req.query;
   page = parseInt(page);
   limit = parseInt(limit);
   const query = {
      heading: { $regex: search, $options: "i" },
   };
   const total = await Blog.countDocuments(query);
   const blogs = await Blog.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
   return res.status(StatusCodes.OK).json(
      new ApiResponse(
         StatusCodes.OK,
         {
            blogs,
            pagination: {
               total,
               page,
               pages: Math.ceil(total / limit),
            },
         },
         "Blogs fetched successfully!"
      )
   );
});

export {
   getUploadUrl,
   createBlog,
   updateBlog,
   deleteBlog,
   getBlogById,
   getAllBlogs,
};
