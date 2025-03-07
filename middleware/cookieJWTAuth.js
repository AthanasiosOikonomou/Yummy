const jwt = require("jsonwebtoken");

const cookieJWTAuth = (req, res, next) => {
  const token = req.cookies.token;
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    res.ClearCookie("token");
    return res.status(500).json({ message: "Bearer time is off." });
  }
};

module.exports = cookieJWTAuth;
