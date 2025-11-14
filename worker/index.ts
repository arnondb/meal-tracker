// Making changes to this file is **STRICTLY** forbidden.
import { app } from './user-routes';
import { GlobalDurableObject } from './core-utils';
// Export the DO class for wrangler to pick up
export { GlobalDurableObject };
// Export the Hono app
export default app;