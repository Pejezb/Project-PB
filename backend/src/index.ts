import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './routes';
import helmet from 'helmet';
import { logger } from './utils/logger';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: { error: 'Demasiadas peticiones, intenta más tarde' },
});

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos de login, intenta más tarde' },
});

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost') || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('CORS no permitido'));
    }
  },
  credentials: true,
}));

app.use(limiter);
app.use('/api/auth/login', loginLimiter);


app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.on('finish', () => {
    const msg = `${req.method} ${req.path} ${res.statusCode}`;
    if (res.statusCode >= 500) logger.error(msg);
    else if (res.statusCode >= 400) logger.warn(msg);
    else logger.info(msg);
  });
  next();
});

app.use('/api', router);

app.get('/health', (_, res) => res.json({ status: 'ok', version: '2.0.0' }));

app.listen(PORT, () => {
  console.log(`🚀 RestaurantOS v2 backend corriendo en http://localhost:${PORT}`);
});