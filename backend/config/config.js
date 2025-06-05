import dotenv from 'dotenv';

dotenv.config();

export default {
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5001/predict',
  environment: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/medical-app',
  port: process.env.PORT || 5000
};