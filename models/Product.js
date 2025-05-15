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
      type: {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        currency: {
          type: String,
          required: true,
          enum: ["USD", "SYP"],
        },
        _id: false,
      },
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
        location: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Location",
          required: true,
        },
        details: {
          type: String,
          trim: true,
          minlength: 5,
          maxlength: 50,
        },
        _id: false,
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
    expiresAt: {
      type: Date,
      //after 30 day
      default: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
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

ProductSchema.index({ status: 1, expiresAt: 1, category: 1, location: 1 });
ProductSchema.index({ status: 1, expiresAt: 1, createdAt: -1 });
ProductSchema.index(
  {
    title: "text",
    description: "text",
  },
  {
    weights: { title: 3, description: 1 }, //  وزن أكبر للعنوان
  }
);
ProductSchema.index({
  status: 1,
  expiresAt: 1,
  "price.amount": 1, //Product.find({     status: "Approved",     expiresAt: { $gt: new Date() },     "price.amount": { $lte: 1000 }   });
});

ProductSchema.index({
  status: 1,
  expiresAt: 1,
  tags: 1,
});

ProductSchema.index({ location: 1, category: 1, status: 1, expiresAt: 1 });

ProductSchema.index({ category: 1, status: 1, expiresAt: 1 });
ProductSchema.index({ location: 1, status: 1, expiresAt: 1 });

const ProductModel = mongoose.model("Product", ProductSchema);

// Joi Validation Schema
// Joi Validation Schema
function validateProduct(obj) {
  const schema = joi.object({
    title: joi.string().min(5).max(100).required(),

    description: joi.string().min(10).max(2000).required(),

    price: joi.object({
      amount: joi.number().min(0).required(),
      currency: joi.string().valid("USD", "SYP").required(),
    }),
    category: joi
      .string()
      // .regex(/^[0-9a-fA-F]{24}$/) // ObjectId
      .required(),

    location: joi
      .object({
        location: joi
          .string()
          // .regex(/^[0-9a-fA-F]{24}$/) // ObjectId
          .required(),
        details: joi.string().min(5).max(50).optional(),
      })
      .required(),

    condition: joi.string().valid("new", "used").required(),

    // برغم أن الحقل isSold و status يُملأن تلقائيًا في السيرفر،
    // يمكنك تضمينهما هنا إذا أردت السماح بإرسال قيم مخصصة:
    // isSold: joi.boolean().optional(),
    // status: joi.string().valid("Approved", "Rejected", "Pending", "Violation").optional(),

    quantity: joi.number().min(1).optional(),

    images: joi.array().items(joi.string()).min(1).required(),

    videos: joi.array().items(joi.string()).optional(),

    tags: joi.array().items(joi.string().trim().max(20)).optional(),
  });

  return schema.validate(obj, { abortEarly: false });
}

module.exports = {
  ProductModel,
  validateProduct,
};
