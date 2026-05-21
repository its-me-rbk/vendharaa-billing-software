const { getConnection, getModels } = require("../config/db");

module.exports = function (req, res, next) {
  if (!req.user || !req.user.businessType) {
    // If not logged in, we might still want to use the master DB (e.g. for login)
    req.db = getConnection('master');
    req.models = getModels(req.db);
    return next();
  }

  let businessType = req.user.businessType;
  
  if (req.user.role === 'superadmin' && req.headers['x-business-type']) {
    businessType = req.headers['x-business-type'];
  }

  const connection = getConnection(businessType);

  if (!connection) {
    return res.status(500).json({
      success: false,
      message: `No database connection found for business type: ${businessType}`,
    });
  }

  req.db = connection;
  req.models = getModels(connection);
  next();
};
