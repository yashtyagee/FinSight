const aiAdvisorService = require('../services/ai.advisor.service');

const getAdvice = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const advice = await aiAdvisorService.getFinancialAdvice(message);
    
    res.status(200).json({
      success: true,
      data: advice
    });
  } catch (err) {
    next(err);
  }
};

const getHealthScore = async (req, res, next) => {
  try {
    const healthData = await aiAdvisorService.getHealthScore();
    res.status(200).json({
      success: true,
      data: healthData
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdvice,
  getHealthScore
};
