const jwt = require("jsonwebtoken");

const checkTokenExists = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    next();
  } else {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRETE_KEY);
      console.log(decoded);
      req.user = decoded;
      next();
    } catch (error) {
      next();
    }
  }
};

module.exports = { checkTokenExists };
