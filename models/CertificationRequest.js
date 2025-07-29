const mongoose = require("mongoose");
const Joi = require("joi");

const CertificationRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["personal", "company"],
      required: true,
    },
    status: {
      type: String,
      enum: ["قيد المراجعة", "مقبول", "مرفوض"],
      default: "قيد المراجعة",
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    personal: {
      fullName: { type: String, trim: true },
      bdate: { type: Date },
      idNumber: { type: String, trim: true },
    },
    company: {
      companyName: { type: String, trim: true },
      licenseNumber: { type: String, trim: true },
    },
    images: [{ type: String }], // S3 keys
  },
  { timestamps: true }
);

function validateAddCert(obj) {
  return Joi.object({
    type: Joi.string().valid("personal", "company").required(),

    personal: Joi.when("type", {
      is: "personal",
      then: Joi.object({
        fullName: Joi.string().min(5).max(100).required(),
        bdate: Joi.date().less("now").required(),
        idNumber: Joi.string().min(5).max(50).required(),
      }).required(),
      otherwise: Joi.forbidden(),
    }),

    company: Joi.when("type", {
      is: "company",
      then: Joi.object({
        companyName: Joi.string().min(2).max(200).required(),
        licenseNumber: Joi.string().min(3).max(100).required(),
      }).required(),
      otherwise: Joi.forbidden(),
    }),

    images: Joi.array()
      .items(Joi.string().min(1))
      .when("type", {
        is: "personal",
        then: Joi.array().min(3).max(3),
      })
      .when("type", {
        is: "company",
        then: Joi.array().min(4).max(4),
      })
      .required(),
  }).validate(obj, { abortEarly: false });
}


const CertificationRequestModel = mongoose.model(
  "CertificationRequest",
  CertificationRequestSchema
);
module.exports = { CertificationRequestModel, validateAddCert };
