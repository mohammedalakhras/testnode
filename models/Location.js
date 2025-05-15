const mongoose = require("mongoose");


const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["country","city", "town","neighborhood"],
    default: "city",
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    default: null,
  },
//ex: ancestors of AL-Rastan is [SyriaID, HomsID] .
  ancestors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
  ],

});


locationSchema.index({ parent: 1, name: 1 });
locationSchema.index({ ancestors: 1 });

locationSchema.pre("save", async function (next) {
  if (!this.isModified("parent")) return next();

  if (!this.parent) {
    this.ancestors = [];
    return next();
  }

  const parentDoc = await this.constructor.findById(this.parent).lean();
  if (!parentDoc) {
    return next(new Error("Parent location not found"));
  }

 
  this.ancestors = [...parentDoc.ancestors, parentDoc._id];
  next();
});

const LocationModel = mongoose.model("Location", locationSchema);




module.exports = { LocationModel };
