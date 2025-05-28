const express = require("express");
const router = express.Router();
const { LocationModel } = require("../models/Location.js");



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
    const locations = await LocationModel.find(
      { parent: null }).select('name type').lean();
      

    return res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/subLocations/:id", async (req, res) => {
  try {
    if (!req.params.id) return res.status(400).json({ msg: "قم بتحديد منطقة ريئيسة" });
    const parentId = req.params.id;

    const locations = await LocationModel.find({ parent: parentId }).select('name type');
    return res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.get("/:pageNumber(\\d+)", async (req, res,next) => {

  if(!req.params.pageNumber)
     return res.status(400).json({ msg: "قم بتحديد رقم صفحة" });
  try {
    //paginagion
    const pageNumber = parseInt(req.params.pageNumber) ;
    const limit = parseInt(req.query.limit) || 10;
    const skip = pageNumber * limit;

    const locations = await LocationModel.find().skip(skip).limit(limit).select('name type');

    // const locations = await LocationModel.find().skip(skip).limit(limit);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});
module.exports = router;
