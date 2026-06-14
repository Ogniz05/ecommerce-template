const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token non fornito' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [user] = await sequelize.query(
      'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ?',
      { replacements: [decoded.id], type: QueryTypes.SELECT }
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Utente non valido o disabilitato' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token scaduto' });
    }
    return res.status(401).json({ success: false, message: 'Token non valido' });
  }
};

// Read-level admin access: full admins AND moderators (read-only panels)
const isAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Accesso non autorizzato' });
  }
  next();
};

// Write-level access: full admins only. Moderators are blocked from any
// create/update/delete and from admin-only panels (dashboard, settings).
const isAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Solo gli amministratori possono eseguire questa azione' });
  }
  next();
};

const isOwnerOrAdmin = (userIdField = 'id') => (req, res, next) => {
  const resourceId = parseInt(req.params[userIdField]);
  if (req.user.role === 'admin' || req.user.id === resourceId) return next();
  return res.status(403).json({ success: false, message: 'Accesso non autorizzato' });
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [user] = await sequelize.query(
        'SELECT id, email, first_name, last_name, role FROM users WHERE id = ? AND is_active = 1',
        { replacements: [decoded.id], type: QueryTypes.SELECT }
      );
      req.user = user || null;
    }
  } catch {
    req.user = null;
  }
  next();
};

module.exports = { authenticate, isAdmin, isAdminOnly, isOwnerOrAdmin, optionalAuth };
