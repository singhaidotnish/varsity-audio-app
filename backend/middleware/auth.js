// backend/middleware/auth.js
const adminAuth = (req, res, next) => {
  // Check for admin token in headers
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No authorization token provided'
    });
  }
  
  const token = authHeader.split(' ')[1];
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (token !== adminToken) {
    return res.status(403).json({
      success: false,
      error: 'Invalid admin token'
    });
  }
  
  next();
};

module.exports = { adminAuth };