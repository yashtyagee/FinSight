const { analyzeVendors } = require('../services/vendor.analysis.service');

const getVendorAnalysis = async (req, res, next) => {
  try {
    const vendors = await analyzeVendors();
    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

module.exports = { getVendorAnalysis };
