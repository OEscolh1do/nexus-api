const validateM2M = (req, res, next) => {
  const token = req.headers['x-service-token'];

  if (!token) {
    return res.status(401).json({ error: 'Missing M2M Token' });
  }

  if (token !== process.env.M2M_SERVICE_TOKEN) {
    return res.status(403).json({ error: 'Invalid M2M Token' });
  }

  next();
};

module.exports = validateM2M;
