import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//create a job
const createJob = asyncHandler(async (req, res, next) => {
   const job = await Career.create({
      ...req.body,
      postedBy: req.user._id,
   });
   return res
      .status(201)
      .json(new ApiResponse(201, job, "Job created successfully"));
});

//get all jobs with pagination and search
const getJobs = asyncHandler(async (req, res) => {
   const { search = "", page = 1, limit = 10, jobType, location } = req.query;
   const query = {
      isActive: true,
      $and: [
         search
            ? {
                 $or: [
                    { title: { $regex: search, $options: "i" } },
                    { company: { $regex: search, $options: "i" } },
                    { location: { $regex: search, $options: "i" } },
                 ],
              }
            : {},
         jobType ? { jobType } : {},
         location ? { location: { $regex: location, $options: "i" } } : {},
      ],
   };
   const jobs = await Career.find(query)
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
   const total = await Career.countDocuments(query);
   return res.status(200).json(
      new ApiResponse(200, {
         jobs,
         total,
         page: Number(page),
         pages: Math.ceil(total / limit),
      })
   );
});

//get a job by slug
const getJobBySlug = asyncHandler(async (req, res, next) => {
   const { slug } = req.params;
   const job = await Career.findOne({ slug }).populate(
      "postedBy",
      "name email"
   );
   if (!job) {
      return next(new ApiError(404, "Job not found"));
   }
   return res.status(200).json(new ApiResponse(200, job));
});

//update a job
const updateJob = asyncHandler(async (req, res, next) => {
   const { id } = req.params;
   const job = await Career.findById(id);
   if (!job) {
      return next(new ApiError(404, "Job not found"));
   }
   // optional: only owner/admin can update
   if (
      !req.user.is_admin &&
      job.postedBy.toString() !== req.user._id.toString()
   ) {
      return next(new ApiError(403, "Not authorized"));
   }
   Object.assign(job, req.body);
   await job.save();
   return res
      .status(200)
      .json(new ApiResponse(200, job, "Job updated successfully"));
});

//delete a job
const deleteJob = asyncHandler(async (req, res, next) => {
   const { id } = req.params;
   const job = await Career.findById(id);
   if (!job) {
      return next(new ApiError(404, "Job not found"));
   }
   await job.deleteOne();
   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Job deleted successfully"));
});

//toggle job status
const toggleJobStatus = asyncHandler(async (req, res, next) => {
   const { id } = req.params;
   const job = await Career.findById(id);
   if (!job) {
      return next(new ApiError(404, "Job not found"));
   }
   job.isActive = !job.isActive;
   await job.save();

   return res.status(200).json(new ApiResponse(200, job, "Job status updated"));
});

export {
   createJob,
   getJobs,
   getJobBySlug,
   updateJob,
   deleteJob,
   toggleJobStatus,
   jobStats,
};
