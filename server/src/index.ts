import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config({
    path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
});

// Now import other modules that depend on env variables
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { connectDB } from './db/connection';
import { initializeTables } from './db/queries';
import { autoMapSonarProjectKeys } from './services/sonarqube/autoMapSonarProjectKeys';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
// Increase body size limit for PDF uploads (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'GitLab Final API Server',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server and connect to database
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize database tables
    await initializeTables();
    
    // Auto-map SonarCloud project keys (run after table init)
    try {
      console.log('🔍 Auto-mapping SonarCloud project keys...');
      await autoMapSonarProjectKeys();
      console.log('✅ SonarCloud project key mapping complete');
    } catch (e) {
      console.warn('⚠️ Failed to auto-map SonarCloud keys:', (e as any).message);
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
