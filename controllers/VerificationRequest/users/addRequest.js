const mongoose = require("mongoose");
const {
  CertificationRequestModel,
  validateAddCert,
} = require("../../../models/CertificationRequest.js");

async function addRequest(req, res) {
  try {
    const user = req.user.id;
    const { error } = validateAddCert(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });

    const pending = await CertificationRequestModel.findOne({
      user,
      status: "pending",
    });
    if (pending) {
      return res
        .status(400)
        .json({ msg: "لديك طلب توثيق قيد المعالجة، لا يمكنك تقديم آخر." });
    }
    const obj = {
      user,
      type: req.body.type,
      images: req.body.images,
    };
    if (req.body.type === "personal") {
      
      obj.personal = {
        fullName: req.body.personal.fullName,
        bdate: req.body.personal.bdate,
        idNumber: req.body.personal.idNumber,
      };
    } else {
            

      obj.company = {
        companyName: req.body.company.companyName,
        licenseNumber: req.body.company.licenseNumber,
      };
    }
console.log(obj);

    const cert = new CertificationRequestModel(obj);
    await cert.save();
    res.status(201).json({ msg: "تم تقديم طلب التوثيق بنجاح.", cert });
  } catch (error) {
    console.error(error);

    res.status(500).json({ msg: "Server Error", error });
  }
}

module.exports = addRequest;
