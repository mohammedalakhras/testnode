const express = require("express");
const router = express.Router();
const { LocationModel } = require("../models/Location.js");
const { default: mongoose } = require("mongoose");

router.post("/", async (req, res) => {
  try {
    const location = new LocationModel(req.body);
    await location.save();
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const location = await LocationModel.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ msg: "Location not found" });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/mainLocations", async (req, res) => {
  try {
    const locations = await LocationModel.find({ parent: null })
      .select("name type")
      .lean();

    return res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

//this api accept only single ID (don't accept IDs as list)

// router.get("/subLocations/:id", async (req, res) => {
//   try {
//     if (!req.params.id) return res.status(400).json({ msg: "قم بتحديد منطقة ريئيسة" });
//     const parentId = req.params.id;

//     const locations = await LocationModel.find({ parent: parentId }).select('name type');
//     return res.status(200).json(locations);
//   } catch (error) {
//     res.status(500).json({ msg: error.message });
//   }
// });

//Edit Version:

router.get("/subLocations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "قم بتحديد معرف/معرفات الموقع الأب" });
    }

    const ids = id
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const objectIds = ids
      .map((str) => {
        if (mongoose.Types.ObjectId.isValid(str)) {
          return new mongoose.Types.ObjectId(str);
        }
        return null;
      })
      .filter((oid) => oid !== null);

    if (objectIds.length === 0) {
      return res.status(400).json({ msg: "لا توجد معرفات صحيحة ضمن القائمة" });
    }

    const locations = await LocationModel.find({ parent: { $in: objectIds } })
      .select("name type")
      .lean();

    return res.status(200).json(locations);
  } catch (error) {
    console.error("Error fetching sub-locations:", error);
    return res.status(500).json({ msg: error.message });
  }
});

router.get("/:pageNumber(\\d+)", async (req, res, next) => {
  if (!req.params.pageNumber)
    return res.status(400).json({ msg: "قم بتحديد رقم صفحة" });
  try {
    //paginagion
    const pageNumber = parseInt(req.params.pageNumber);
    const limit = parseInt(req.query.limit) || 10;
    const skip = pageNumber * limit;

    const locations = await LocationModel.find()
      .skip(skip)
      .limit(limit)
      .select("name type");

    // const locations = await LocationModel.find().skip(skip).limit(limit);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});
module.exports = router;
