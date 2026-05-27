import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Blog } from "../models/blog.model.js";
import { generateUploadURL, deleteFileFromS3 } from "../helpers/s3Helper.js";
import slugify from "slugify";
import { StatusCodes } from "http-status-codes";
import { validateFile } from "../validators/file.validation.js";

// generate presigned URL for S3 upload
const getUploadUrl = asyncHandler(async (req, res) => {
   const { fileName, fileType, size } = req.body;
   if (!fileName) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "fileName is required!");
   }
   if (!fileType) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "fileType is required!");
   }
   validateFile({ fileName, fileType, size });
   const data = await generateUploadURL(fileName, fileType, "blogs");
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { data },
         message: "Upload URL generated successfully!",
      })
   );
});

//create blog
const createBlog = asyncHandler(async (req, res) => {
   const { heading, content, mtitle, mdesc, images } = req.body;
   if (!heading) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Heading is required!");
   }
   if (!content) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Content is required!");
   }
   if (!images || images.length === 0) {
      throw new ApiError(
         StatusCodes.BAD_REQUEST,
         "At least one image is required!"
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
      throw new ApiError(
         StatusCodes.INTERNAL_SERVER_ERROR,
         "Blog creation failed!"
      );
   }
   return res.status(StatusCodes.CREATED).json(
      new ApiResponse({
         StatusCodes: StatusCodes.CREATED,
         data: { blog },
         message: "Blog created successfully!",
      })
   );
});

// update blog
const updateBlog = asyncHandler(async (req, res) => {
   const blog = await Blog.findById(req.params.id);
   if (!blog) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Blog not found!");
   }
   const { images } = req.body;
   if (images && images.length === 0) {
      throw new ApiError(
         StatusCodes.BAD_REQUEST,
         "At least one image is required!"
      );
   }
   const oldImages = blog.image || [];
   const newImages = images || oldImages;
   const removedImages = oldImages.filter(
      (oldImg) => !newImages.some((newImg) => newImg.key === oldImg.key)
   );
   for (const img of removedImages) {
      if (img.key) {
         await deleteFileFromS3(img.key);
      }
   }
   blog.image = newImages;
   blog.heading = req.body.heading || blog.heading;
   blog.content = req.body.content || blog.content;
   blog.mtitle = req.body.mtitle || blog.mtitle;
   blog.mdesc = req.body.mdesc || blog.mdesc;
   blog.slug =
      slugify(
         typeof req.body.heading === "string" ? req.body.heading : blog.heading,
         { lower: true }
      ) || blog.slug;
   await blog.save();
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         StatusCodes: StatusCodes.OK,
         data: { blog },
         message: "Blog updated successfully!",
      })
   );
});

//delete blog by id
const deleteBlog = asyncHandler(async (req, res) => {
   const blog = await Blog.findById(req.params.id);
   if (!blog) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Blog not found!");
   }
   for (let img of blog.image) {
      await deleteFileFromS3(img.key);
   }
   await blog.deleteOne();
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: {},
         message: "Blog deleted successfully!",
      })
   );
});

//get blog by slug
const getBlogBySlug = asyncHandler(async (req, res) => {
   const { slug } = req.params;
   if (!slug) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Blog slug is required!");
   }
   const blog = await Blog.findOne({ slug });
   if (!blog) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Blog not found!");
   }
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { blog },
         message: "Blog fetched successfully!",
      })
   );
});

//get all blogs
const getAllBlogs = asyncHandler(async (req, res) => {
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
      new ApiResponse({
         StatusCodes: StatusCodes.OK,
         data: {
            blogs,
            pagination: {
               total,
               page,
               pages: Math.ceil(total / limit),
            },
         },
         message: "Blogs fetched successfully!",
      })
   );
});

export {
   getUploadUrl,
   createBlog,
   updateBlog,
   deleteBlog,
   getBlogBySlug,
   getAllBlogs,
};
