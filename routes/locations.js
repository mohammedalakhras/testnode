const express = require("express");
const router = express.Router();
const { LocationModel } = require("../models/Location.js");

router.get("/:pageNumber", async (req, res) => {
  try {
    //paginagion
    const pageNumber = parseInt(req.params.pageNumber) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const skip = pageNumber * limit;

    const locations = await LocationModel.find().skip(skip).limit(limit);

    // const locations = await LocationModel.find().skip(skip).limit(limit);
    res.json(locations);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

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
module.exports = router;
