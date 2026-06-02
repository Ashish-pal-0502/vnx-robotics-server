import mongoose from "mongoose";

const robotSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
         minlength: 2,
         maxlength: 100,
      },

      slug: {
         type: String,
         unique: true,
         lowercase: true,
         trim: true,
      },

      description: {
         type: String,
         required: true,
         trim: true,
         minlength: 10,
      },

      category: {
         type: String,
         required: true,
         trim: true,
      },

      specifications: [
         {
            label: {
               type: String,
               required: true,
               trim: true,
            },
            value: {
               type: String,
               required: true,
               trim: true,
            },
         },
      ],

      keyPoints: [
         {
            type: String,
            trim: true,
         },
      ],

      applications: [
         {
            type: String,
            trim: true,
         },
      ],

      images: [
         {
            url: String,
            key: String,
         },
      ],
   },
   {
      timestamps: true,
   }
);

export const Robot = mongoose.model("Robot", robotSchema);