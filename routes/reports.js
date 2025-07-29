const express = require("express");
const router = express.Router();
//controllers
const addReport = require("../controllers/reports/addReport.js");
const getReports = require("../controllers/reports/getReports.js");
const getReportDetail = require("../controllers/reports/admin/getReportDetail.js");
const deleteReport = require("../controllers/reports/deleteReport.js");
const getReportsAdmin = require("../controllers/reports/admin/getReportsAdmin.js");
const {getUploadUrlReport} = require("../controllers/auth/aws/reports/getUploadUrlReport");
const { changeStatus } = require("../controllers/reports/admin/changeStatus.js");

//middlewares
const {verifyNotBlocked} = require("../middlewares/token/verifyNotBlocked.js");
const { fillRole } = require("../middlewares/admin/fillRole.js");

//user reports routes
router.get("/users/uploadURL", verifyNotBlocked, getUploadUrlReport);
router.post("/users", verifyNotBlocked, addReport);
router.get("/users", verifyNotBlocked, getReports);
router.delete("/users/:reportId", verifyNotBlocked,fillRole, deleteReport);

//admin reports routes
router.get("/admin/reports", verifyNotBlocked, fillRole, getReportsAdmin);
router.get("/admin/reports/:reportId",  verifyNotBlocked,  fillRole,  getReportDetail);
router.post("/admin/changeStatus/:reportId",  verifyNotBlocked,  fillRole,  changeStatus);

module.exports =  router ;
