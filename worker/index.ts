// Making changes to this file is **STRICTLY** forbidden.
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { userRoutes } from './user-routes';
import { GlobalDurableObject, type Env } from './core-utils';
// Export the DO class for wrangler to pick up
export { GlobalDurableObject };
// Initialize Hono App
const app = new Hono<{ Bindings: Env }>();
// --- MIDDLEWARE ---
app.use('*', logger());
app.use('/api/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }));
// --- USER ROUTES ---
userRoutes(app);
// --- ERROR HANDLING ---
app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404));
app.onError((err, c) => {
  console.error(`[ERROR] ${err.stack || err}`);
  return c.json({ success: false, error: 'Internal Server Error' }, 500);
});
// Export the Hono app
export default app;