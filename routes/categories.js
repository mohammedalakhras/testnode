const express = require("express");
const router = express.Router();
const { CategoryModel } = require("../models/Category.js");

router.get("/", async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const category = new CategoryModel(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
