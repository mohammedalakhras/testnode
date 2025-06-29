const { default: mongoose } = require("mongoose");
const joi = require("joi");

const FollowSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

FollowSchema.index({ follower: 1 });
FollowSchema.index({ followee: 1 });

const Follow = mongoose.model("Follow", FollowSchema);

const followValidationSchema = joi
  .object({
    follower: joi
      .string()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "valid ObjectId")
      .required(),

    followee: joi
      .string()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error("any.invalid");
        }
        return value;
      }, "valid ObjectId")
      .required(),
  })
  .custom((obj, helpers) => {
    if (obj.follower === obj.followee) {
      return helpers.error("any.invalid", {
        message: "Cannot follow yourself",
      });
    }
    return obj;
  });

module.exports = { Follow, followValidationSchema };
