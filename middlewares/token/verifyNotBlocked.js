const jwt = require("jsonwebtoken");
const { UserModel } = require("../../models/User");

const verifyNotBlocked = async (req, res, next) => {
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

    const user = await UserModel.findById(decoded.id).select("state");

    req.user = decoded;

    if (user.state === "active") next();
    else {
      return res.status(403).json({
        success: false,
        msg: "حسابك محظور راجع فريق الدعم.",
      });
    }
  } catch (error) {
    return res.status(403).json({
      success: false,
      msg: "Invalid or expired token",
    });
  }
};

module.exports = { verifyNotBlocked };
