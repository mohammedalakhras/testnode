const { default: mongoose } = require("mongoose");
const joi = require("joi");

const { CategoryModel } = require("./Category.js");

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
      // enum: ["new", "used",""],
      default: "new",
      // required: true,
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
        high: {
          type: String,
          required: true,
        },
        med: {
          type: String,
          // required: true,
        },
        low: {
          type: String,
          // required: true,
        },
          _id: false,
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
        lowercase: true,
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
async function validateProduct(obj) {
  const allowedConditions = await getCategoryConditions(obj.category);
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

    condition: joi
      .string()
      .valid(...allowedConditions)
      .required(),

    // برغم أن الحقل isSold و status يُملأن تلقائيًا في السيرفر،
    // يمكنك تضمينهما هنا إذا أردت السماح بإرسال قيم مخصصة:
    // isSold: joi.boolean().optional(),
    // status: joi.string().valid("Approved", "Rejected", "Pending", "Violation").optional(),

    quantity: joi.number().min(1).optional(),

    images: joi
      .array()
      .items(
        joi.object({
          high: joi.string().required(),
          med: joi.string(),
          // .required()
          low: joi.string(),
          // .required()
        })
      )
      .min(1)
      .required(),

    videos: joi.array().items(joi.string()).optional(),

    tags: joi.array().items(joi.string().trim().max(20)).optional(),
  });

  return schema.validate(obj, { abortEarly: false });
}

async function validateUpdateProduct(obj, currentCategory) {
  const validateObject = {
    title: joi.string().min(5).max(100).optional(),
    description: joi.string().min(10).max(2000).optional(),
    price: joi
      .object({
        amount: joi.number().min(0).required(),
        currency: joi.string().valid("USD", "SYP").required(),
      })
      .optional(),
    category: joi.string().optional(),
    location: joi
      .object({
        location: joi.string().required(),
        details: joi.string().min(5).max(50).optional(),
      })
      .optional(),

    quantity: joi.number().min(1).optional(),
     images: joi.array()
      .items(
        joi.object({
          high: joi.string().required(),
          med: joi.string(),
          low: joi.string()
        })
      )
      .min(1)
      .optional(),
    videos: joi.array().items(joi.string()).optional(),
    tags: joi.array().items(joi.string().trim().max(20)).optional(),
  };
  let categoryToCheck = obj.category || currentCategory;
  if (categoryToCheck) {
    const allowedConditions = await getCategoryConditions(categoryToCheck);
    validateObject.condition = joi
      .string()
      .valid(...allowedConditions)
      .optional();
  }
  const schema = joi.object(validateObject).unknown(false); // Reject unknown fields

  return schema.validate(obj);
}

async function getCategoryConditions(categoryId) {
  if (!categoryId) {
    return ["new", "used"];
  }

  // Fetch the category document
  const category = await CategoryModel.findById(categoryId).lean();
  if (!category) {
    throw new Error("Category not found for ID: " + categoryId);
  }

  // Helper to return if array is non-empty
  const isValidArray = (arr) => Array.isArray(arr) && arr.length > 0;

  // 1. Check current category
  if (isValidArray(category.allowedConditions)) {
    console.log(category.allowedConditions);

    return category.allowedConditions;
  }

  // 2. Traverse ancestors (nearest first)
  if (Array.isArray(category.ancestors)) {
    for (let i = category.ancestors.length - 1; i >= 0; i--) {
      const ancestorId = category.ancestors[i];
      const ancestor = await CategoryModel.findById(ancestorId).lean();
      if (ancestor && isValidArray(ancestor.allowedConditions)) {
        console.log(ancestor.allowedConditions);

        return ancestor.allowedConditions;
      }
    }
  }

  // 3. Fallback defaults
  return ["new", "used"];
}

module.exports = {
  ProductModel,
  validateProduct,
  validateUpdateProduct,
};
