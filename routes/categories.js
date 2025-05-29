const express = require("express");
const router = express.Router();
const { CategoryModel } = require("../models/Category.js");

router.get("/", async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const category = new CategoryModel(req.body);
    await category.save();
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

router.get("/mainCategories", async (req, res) => {
  try {
    const allowedConditions = await CategoryModel.find({ parent: null });
    return res.json(allowedConditions);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

router.get("/subCategories/:id", async (req, res) => {
  try {
    const parent = req.params.id;

    const allowedConditions = await CategoryModel.find({ parent: parent });
    return res.json(allowedConditions);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const allowedConditions = await CategoryModel.findById(
      req.params.id
    ).select("allowedConditions");
    return res.json(allowedConditions);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});
module.exports = router;
