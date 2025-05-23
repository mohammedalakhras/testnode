const mongoose = require("mongoose");
const joi = require("joi");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
      minlength: 5,
      maxlength: 25,
      match: [
        /[/^[a-z0-9]{1,20}[_\.]{0,1}[a-z0-9]{1,20}$/gm,
        "Invalid username format",
      ],
    },

    fcmTokens: [
      {
        type: String,
        trim: true,
      },
    ],

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      required: function () {
        return this.authProvider.includes("local");
      },
    },
    phoneVisible: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // تسمح بقيم null دون تكرار
    },

    authProvider: {
      type: [String], // Array
      enum: ["local", "google"],
      default: ["local"],
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider.includes("local");
      },
    },

    activated: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      minlength: 5,
      maxlength: 5,
    },
    verificationCodeExpires: {
      type: Date,
    },
    passwordResetCode: {
      type: String,
      minlength: 5,
      maxlength: 5,
    },
    passwordResetExpires: {
      type: Date,
    },

    bio: {
      type: String,
      maxlength: 128,
      trim: true,
    },

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
    },
    // when alerts>=3 => state:blocked
    numberOfAlerts: {
      type: Number,
      default: 0,
    },
    state: {
      type: String,
      enum: ["active", "blocked", "semi-blocked"],
      default: "active",
    },
    verifiedStatus: {
      type: String,
      enum: ["Normal", "Verified Company", "Verified Account"],
      default: "Normal",
    },
    photo: {
      type: String, //CDN
      trim: true,
    },
    cover: {
      type: String, //CDN
      trim: true,
    },
    rate: {
      stars: {
        type: Number,
        default: 0,
        min: 0,
      },
      number: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    sections: [
      {
        order: { type: Number, required: true },
        name: { type: String, required: true },
        content: { type: String, required: true },
      },
    ],

    // followers: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
    // following: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    // ],
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    lastLoginTime: {
      type: String,
    },
    numberOfReports: {
      //all reports( accepted(alerts) or not)
      type: Number,
      default: 0,
    },
    favourites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    //for change email
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
      minlength: 5,
      maxlength: 100,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },
    pendingEmailVerificationCode: {
      type: String,
      minlength: 5,
      maxlength: 5,
    },
    pendingEmailVerificationExpires: {
      type: Date,
    },
  },

  {
    timestamps: true,
  }
);



UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ location: 1 });
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });

UserSchema.methods.incrementAlerts = async function () {
  this.numberOfAlerts += 1;
  if (this.numberOfAlerts >= 3) {
    this.state = "blocked";
  }
  await this.save();
};

function validateRegisterUser(obj) {
  const schema = joi.object({
    email: joi.string().email().min(5).max(100).required(),

    username: joi
      .string()
      .min(5)
      .max(25)
      .pattern(/[/^[a-z0-9]{1,20}[_\.]{0,1}[a-z0-9]{1,20}$/, "username")
      .when("authProvider", {
        is: joi.array().items(joi.string().valid("local")).has("local"),
        then: joi.required(),
      }),

    fullName: joi.string().min(5).max(100).required(),

    phone: joi
      .string()
      .pattern(/^\+?[0-9]{8,15}$/)
      .when("authProvider", {
        is: joi.array().items(joi.string().valid("local")).has("local"),
        then: joi.required(),
      }),

    password: joi
      .string()
      .min(6)
      .max(128)
      .when("authProvider", {
        is: joi.array().items(joi.string().valid("local")).has("local"),
        then: joi.required(),
      }),

    authProvider: joi
      .array()
      .required()
      .items(joi.string().valid("local", "google"))
      .default(["local"]),

    googleId: joi.string().when("authProvider", {
      is: joi.array().items(joi.string().valid("google")).has("google"),
      then: joi.required(),
    }),
    fcmTokens: [{ type: String }],
  });

  return schema.validate(obj);
}

function validateLoginByUsername(obj) {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).max(128).required(),
  });

  return schema.validate(obj);
}

function validateProfileUpdate(data) {
  const updateProfileSchema = joi.object({
    fullName: joi.string().min(5).max(100),
    username: joi
      .string()
      .min(5)
      .max(25)
      .pattern(/[/^[a-z0-9]{1,20}[_\.]{0,1}[a-z0-9]{1,20}$/, "username"),
    phone: joi.string().pattern(/^\+?[0-9]{8,15}$/),
    phoneVisible: joi.boolean(),
    password: joi.string().min(6).max(128),
    email: joi.string().email().min(5).max(100),
  });
  return updateProfileSchema.validate(data);
}

const UserModel = new mongoose.model("User", UserSchema);

module.exports = {
  UserModel,
  validateLoginByUsername,
  validateRegisterUser,
  validateProfileUpdate,
};
