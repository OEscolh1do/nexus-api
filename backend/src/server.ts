import { app } from './app';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 NEXUS Backend (TS) running on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
