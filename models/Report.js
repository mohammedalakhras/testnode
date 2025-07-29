const mongoose = require("mongoose");
const Joi = require("joi");

const ReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["product", "user"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reasonType: {
      type: String,
      enum: [
        "احتيالي",
        "مخالف",
        "مسيء",
        "انتحال شخصية",
        "وصف غير متطابق",
        "مكرر",
        "أخرى",
      ],
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      required: true,
    },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["قيد المعالجة", "مقبول", "مرفوض"],
      default: "قيد المعالجة",
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);
ReportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  { unique: true }
);


function validateAddReport(obj) {
  const schema = Joi.object({
    targetType: Joi.string().valid("product", "user").required().messages({
      "any.required": "نوع الهدف مطلوب.",
      "any.only": "targetType يجب أن تكون إما 'product' أو 'user'.",
    }),

    targetId: Joi.string()
      // .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "any.required": "معرّف الهدف مطلوب.",
        "string.pattern.base": "معرّف الهدف غير صالح.",
      }),

    reasonType: Joi.string()
      .valid(
        "احتيالي",
        "مخالف",
        "مسيء",
        "انتحال شخصية",
        "وصف غير متطابق",
        "مكرر",
        "أخرى"
      )
      .required()
      .messages({
        "any.required": "نوع الإبلاغ مطلوب.",
        "any.only": "reasonType غير صالح.",
      }),

    text: Joi.string().trim().min(5).max(2000).required().messages({
      "any.required": "نص الإبلاغ مطلوب.",
      "string.min": "نص الإبلاغ يجب أن يكون على الأقل 5 حروف.",
      "string.max": "نص الإبلاغ لا يمكن أن يزيد عن 2000 حرف.",
    }),

    images: Joi.array()
      .items(Joi.string().trim().min(1))
      .max(5)
      .optional()
      .messages({
        "array.max": "يمكن رفع ما لا يزيد عن 5 صور.",
      }),
  });

  return schema.validate(obj, { abortEarly: false });
}

const ReportModel = mongoose.model("Report", ReportSchema);

module.exports = {
  ReportModel,
  validateAddReport,
};
