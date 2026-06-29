// COMPONENT: Auth Middleware [Component: Express.js]
// PURPOSE: Validates JWT and extracts roles on every incoming API request (ADR-05, NFR01)

// dependencies
const jwt = require('jsonwebtoken');


// Intercepts every request and validates Bearer token before it reaches any controller
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const token = authHeader.split(' ')[1]; // extract token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
     // attach decoded claims to req.user so controllers and rbacMiddleware can access them
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId, // scope all downstream queries to the correct tenant (ADR-04)
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorised' }); // invalid or expired token (returns 401 (Figure 17))
  }
}

// Returns a middleware function that checks req.user role against the routes allowed roles
function rbacMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

module.exports = { authMiddleware, rbacMiddleware };
