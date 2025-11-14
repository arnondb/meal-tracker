import { createMiddleware } from 'hono/factory';
import { AuthUserEntity } from './entities';
import type { AuthUser } from '@shared/types';
import type { Env } from './core-utils';
export type AuthVariables = {
  user: AuthUser;
};
export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  const userEntity = new AuthUserEntity(c.env, token, 'token');
  if (!(await userEntity.exists())) {
    return c.json({ success: false, error: 'Invalid session' }, 401);
  }
  const user = await userEntity.getState();
  c.set('user', user);
  await next();
});