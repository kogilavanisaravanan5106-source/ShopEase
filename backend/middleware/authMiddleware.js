
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Please log in to access this resource.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please log in again.",
    });
  }
}

// Allow only administrators to access protected admin routes.
function adminMiddleware(req, res, next) {
  const User = require("../models/User");

  User.findById(req.user.userId)
    .select("role")
    .then((user) => {
      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required.",
        });
      }

      next();
    })
    .catch((error) => {
      console.error("Admin authorization error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to verify admin permissions.",
      });
    });
}

module.exports = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;
