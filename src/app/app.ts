import express from 'express';
import healthRouter from '../routes/health.routes.js';
import apiRouter from '../routes/api.routes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', healthRouter);
app.use('/', apiRouter);

export default app;
