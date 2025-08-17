const express = require("express");

const router = express.Router();

const addRequest = require("../controllers/VerificationRequest/users/addRequest.js");
const getMyRequests = require("../controllers/VerificationRequest/users/getMyRequests.js");
const {getUploadUrlVeriRequest} = require("../controllers/auth/aws/verificationRequest/getUploadUrlCert.js"); 
const getRequestsAdmin = require("../controllers/VerificationRequest/admin/getRequestsAdmin.js");
const getRequestDetail = require("../controllers/VerificationRequest/admin/getRequestDetail.js");
const changeStatus = require("../controllers/VerificationRequest/admin/changeStatus.js");
const {verifyNotBlocked} = require("../middlewares/token/verifyNotBlocked.js");
const {fillRole} = require("../middlewares/admin/fillRole.js");

// user
router.post("/cert/upload-url", verifyNotBlocked, getUploadUrlVeriRequest);
router.post("/cert", verifyNotBlocked, addRequest);
router.get("/cert", verifyNotBlocked, getMyRequests);

// admin
router.get("/admin/cert", verifyNotBlocked, fillRole, getRequestsAdmin);
router.get("/admin/cert/:id", verifyNotBlocked, fillRole, getRequestDetail);
router.post(
  "/admin/cert/:requestID/status",
  verifyNotBlocked,
  fillRole,
  changeStatus
);

module.exports = router;
