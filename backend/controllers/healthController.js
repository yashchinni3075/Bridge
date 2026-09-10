export const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bridge API is operational',
    timestamp: new Date().toISOString(),
  });
};
