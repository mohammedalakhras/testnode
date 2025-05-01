const { default: mongoose } = require("mongoose");
const joi = require("joi");

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    price: {
      type: Number,

      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: {
        city: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "City",
          required: true,
        },
        region: {
          type: String,
          trim: true,
          minlength: 5,
          maxlength: 50,
        },
      },
      required: true,
    },
    condition: {
      type: String,
      enum: ["new", "used"],
      default: "new",
      required: true,
    },

    isSold: {
      type: Boolean,
      default: false,
      required: true,
    },
    status: {
      type: String,
      enum: ["Approved", "Rejected", "Pending", "Violation"],
      default: "Pending",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    videos: [
      {
        type: String, // CDN URLs
      },
    ],
    tags: [
      {
        type: String,
        maxlength: 20,
        trim: true,
      },
    ],

    views: {
      type: Number,
      default: 0,
    },
    reports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // isApproved: {
    //   type: Boolean,
    //   default: false,
    // },
    // isActive: {
    //   type: Boolean,
    //   default: true, // يمكن تعطيله عند المخالفات
    // },
  },
  { timestamps: true }
);

// Joi Validation Schema
function validateProduct(obj) {
  const schema = joi.object({
    title: joi.string().min(5).max(100).required(),
    description: joi.string().min(10).max(2000).required(),
    price: joi.number().min(0).required(),
    category: joi.string().required(), // يُفترض أن تَستقبل سلسلة تمثل ObjectId
    location: joi.object({
      city: joi.string().required(),  // يمثل ObjectId للمدينة
      region: joi.string().min(5).max(50).optional() // اختياري، إذا وُجد فهو يخضع للقيود المذكورة
    }).required(),
    condition: joi.string().valid("new", "used").required(),
    quantity: joi.number().min(1).optional(),
    images: joi.array().items(joi.string()).min(1).required(),
    videos: joi.array().items(joi.string()).optional(),
    tags: joi.array().items(joi.string().trim().max(20)).optional(),
  });

  return schema.validate(obj);
}

const ProductModel = mongoose.model("Product", ProductSchema);

module.exports = {
  ProductModel,
  validateProduct,
};
