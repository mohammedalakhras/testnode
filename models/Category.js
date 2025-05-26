const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },
  ancestors: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Category",
    default: [],
  },
  allowedConditions: {
    type: [String],
    default: null,
    validate: {
      validator: function (v) {
        // treat null the same as empty-array
        const arr = Array.isArray(v) ? v : [];
        const hasParent = this.parent != null;
        return hasParent
          ? (arr.length === 0)
          : (arr.length > 0);
      },
      message() {
        return this.parent
          ? "allowedConditions must be empty when parent is present."
          : "allowedConditions must be non-empty when parent is not present.";
      },
    },
  },
});
CategorySchema.index({ name: 1, parent: 1 }, { unique: true });
CategorySchema.index({ ancestors: 1 });

CategorySchema.pre("save", async function (next) {
  if (!this.isModified("parent")) return next();

  if (!this.parent) {
    this.ancestors = [];
    return next();
  }

  const parentDoc = await this.constructor.findById(this.parent).lean();
  if (!parentDoc) {
    return next(new Error("Parent category not found"));
  }

  this.ancestors = [...parentDoc.ancestors, parentDoc._id];
  next();
});

const CategoryModel = mongoose.model("Category", CategorySchema);

module.exports = { CategoryModel };
