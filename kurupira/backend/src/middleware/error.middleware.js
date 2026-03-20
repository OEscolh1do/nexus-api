const AppError = require('../utils/AppError');
const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log Error for Debugging
  if (process.env.NODE_ENV !== 'test') {
      console.error('💥 ERROR 💥', {
          name: err.name,
          message: err.message
      });
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Erro de validação',
      details: err.format()
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }

  // Operational Errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Fallback
  return res.status(500).json({
    success: false,
    error: 'Erro interno no servidor'
  });
};

module.exports = errorHandler;
