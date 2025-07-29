// ملف models/Rating.js

const joi = require("joi");
const mongoose = require("mongoose");

const ReplySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true, maxlength: 512 },
  createdAt: { type: Date, default: Date.now },
});

const RatingSchema = new mongoose.Schema({
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  author: {
    // من قام بالتقييم
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    // "positive" أو "negative"
    type: String,
    enum: ["positive", "negative"],
    required: true,
  },
  stars: {
    // فقط إذا type="positive"
    type: Number,
    min: 1,
    max: 5,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1024,
  },
  replies: [ReplySchema], // الردود المضمّنة
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

//make unique index for targetUser and author
RatingSchema.index({ targetUser: 1, author: 1 }, { unique: true });

RatingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const RatingModel = mongoose.model("Rating", RatingSchema);

const validateAddRating = (obj) => {
  const schema = joi.object({
    type: joi.string().valid("positive", "negative").required(),
    stars: joi.when("type", {
      is: "positive",
      then: joi.number().min(1).max(5).required(),
    }),
    text: joi.string().trim().min(3).max(1024).required(),
    targetUser: joi.string().required(),
    author: joi.string().required(),
  });
  return schema.validate(obj);
};

const validateEditRating = (obj) => {
  const schema = joi.object({
    stars: joi.number().min(1).max(5).optional(),
    text: joi.string().trim().min(5).max(1024).required(),
  });
  return schema.validate(obj);
};
module.exports = { RatingModel, validateAddRating, validateEditRating };
