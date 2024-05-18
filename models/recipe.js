const mongoose = require("mongoose");
const path = require("path");

const coverImageBasePath = "uploads/recipeCovers";

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  publishDate: {
    type: Date,
    required: true,
  },
  time: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  coverImageName: {
    type: String,
    required: true,
  },
  cook: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Cook",
  },
});

recipeSchema.virtual("coverImagePath").get(function () {
  if (this.coverImageName != null) {
    return path.join("/", coverImageBasePath, this.coverImageName);
  }
});

module.exports = mongoose.model("Recipe", recipeSchema);
module.exports.coverImageBasePath = coverImageBasePath;
