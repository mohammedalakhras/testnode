const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      msg: "Authorization token is required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRETE_KEY);
    console.log(decoded);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      msg: "Invalid or expired token",
    });
  }
};

module.exports = { verifyToken };
