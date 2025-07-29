const express = require("express");
const { addSection } = require("../controllers/user/sections/addSection.js");
const {
  updateSection,
} = require("../controllers/user/sections/updateSection.js");
const {
  deleteSection,
} = require("../controllers/user/sections/deleteSection.js");
const { getSections } = require("../controllers/user/sections/getSections.js");

const router = express.Router();

const { verifyToken } = require("../middlewares/token/verifyToken.js");
const { checkTokenExists } = require("../middlewares/token/checkTokenExists.js");

// CRUD for own sections
router.post("/users/sections", verifyToken, addSection);
router.put("/users/sections/:sectionId", verifyToken, updateSection);
router.delete("/users/sections/:sectionId", verifyToken, deleteSection);

// Read (own or other's)
router.get("/users/:userId/sections", getSections);
router.get("/users/sections", checkTokenExists,getSections);

module.exports = router;
