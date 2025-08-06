const express = require("express");
const router = express.Router();
const { CategoryModel } = require("../models/Category.js");
const { default: mongoose } = require("mongoose");

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
    const Categories = await CategoryModel.find({ parent: null });
    return res.json(Categories);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

router.get("/subCategories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ msg: "قم بتحديد معرّف/معرّفات الصنف ذو المستوى الأعلى" });
    }

    const ids = id
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const objectIds = ids
      .map((str) =>
        mongoose.Types.ObjectId.isValid(str)
          ? new mongoose.Types.ObjectId(str)
          : null
      )
      .filter((o) => o);

    if (objectIds.length === 0) {
      return res.status(400).json({ msg: "لا توجد معرّفات صحيحة ضمن القائمة" });
    }

    const subCats = await CategoryModel.find({ parent: { $in: objectIds } });
    return res.status(200).json(subCats);
  } catch (error) {
    console.error("Error fetching sub-categories:", error);
    return res.status(500).json({ msg: error.message });
  }
});

//GET Allowed Conditions for each Category.
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "قم بتحديد معرّف/معرّفات الصنف" });
    }

    const ids = id
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const objectIds = ids
      .map((str) =>
        mongoose.Types.ObjectId.isValid(str)
          ? new mongoose.Types.ObjectId(str)
          : null
      )
      .filter((o) => o);

    if (objectIds.length === 0) {
      return res.status(400).json({ msg: "لا توجد معرّفات صحيحة ضمن القائمة" });
    }

    if (objectIds.length === 1) {
      const cat = await CategoryModel.findById(objectIds[0]).select(
        "allowedConditions"
      );
      if (!cat) {
        return res.status(404).json({ msg: "الفئة غير موجودة" });
      }
      return res.json(cat);
    }

    // إذا كانت قائمة، نعيد مصفوفة من { _id, allowedConditions }
    const cats = await CategoryModel.find({ _id: { $in: objectIds } }).select(
      "allowedConditions"
    );
    return res.json(cats);
  } catch (error) {
    console.error("Error fetching allowedConditions:", error);
    return res.status(500).json({ msg: error.message });
  }
});
module.exports = router;
