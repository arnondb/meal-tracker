import { Hono } from 'hono';
import type { Env } from './core-utils';
import { AuthUserEntity, FamilyEntity, MealEntity, PresetEntity } from "./entities";
import { ok, bad, notFound, isStr, Index } from './core-utils';
import { AuthUser, Family, Meal, Preset } from "@shared/types";
import { startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import { authMiddleware, AuthVariables } from './auth';
export const userRoutes = (app: Hono<{ Bindings: Env }>) => {
  // --- PUBLIC ROUTES ---
  app.get('/api/health', (c) => c.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() }}));
  app.post('/api/auth/register', async (c) => {
    const body = await c.req.json<{ name?: string; email?: string; password?: string }>();
    if (!isStr(body.name) || !isStr(body.email) || !isStr(body.password)) {
      return bad(c, 'Name, email, and password are required');
    }
    if (body.password.length < 6) {
      return bad(c, 'Password must be at least 6 characters');
    }
    const existingUser = new AuthUserEntity(c.env, body.email, 'email');
    if (await existingUser.exists()) {
      return bad(c, 'An account with this email already exists');
    }
    const userId = crypto.randomUUID();
    const token = crypto.randomUUID();
    // Family is no longer created on registration. User will create or join one.
    const newUser: AuthUser = {
      id: userId,
      name: body.name,
      email: body.email,
      familyId: null,
      token: token,
    };
    await new AuthUserEntity(c.env, userId, 'id').save(newUser);
    await new AuthUserEntity(c.env, body.email, 'email').save(newUser);
    await new AuthUserEntity(c.env, token, 'token').save(newUser);
    return ok(c, { token });
  });
  app.post('/api/auth/login', async (c) => {
    const body = await c.req.json<{ email?: string; password?: string }>();
    if (!isStr(body.email) || !isStr(body.password)) {
      return bad(c, 'Email and password are required');
    }
    const userEntity = new AuthUserEntity(c.env, body.email, 'email');
    if (!(await userEntity.exists())) {
      return bad(c, 'Invalid credentials');
    }
    const user = await userEntity.getState();
    return ok(c, { token: user.token });
  });
  // --- PROTECTED ROUTES ---
  const protectedRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
  protectedRoutes.use('/api/*', authMiddleware);
  protectedRoutes.get('/api/auth/me', async (c) => {
    const user = c.get('user');
    let family: Family | null = null;
    if (user.familyId) {
      const familyEntity = new FamilyEntity(c.env, user.familyId);
      if (await familyEntity.exists()) {
        family = await familyEntity.getState();
      }
    }
    return ok(c, { user, family });
  });
  protectedRoutes.put('/api/auth/me', async (c) => {
    const user = c.get('user');
    const body = await c.req.json<{ name?: string }>();
    if (!isStr(body.name)) {
      return bad(c, 'Name is required and must be a string.');
    }
    const updatedUser: AuthUser = { ...user, name: body.name };
    // Update user record in all indexed locations for consistency
    await new AuthUserEntity(c.env, user.id, 'id').save(updatedUser);
    await new AuthUserEntity(c.env, user.email, 'email').save(updatedUser);
    await new AuthUserEntity(c.env, user.token, 'token').save(updatedUser);
    return ok(c, updatedUser);
  });
  protectedRoutes.post('/api/families/create', async (c) => {
    const user = c.get('user');
    const body = await c.req.json<{ name?: string }>();
    if (!isStr(body.name)) {
      return bad(c, 'Family name is required.');
    }
    if (user.familyId) {
      return bad(c, 'User is already in a family.');
    }
    const familyId = crypto.randomUUID();
    const joinCode = crypto.randomUUID().substring(0, 8).toUpperCase();
    const newFamily: Family = { id: familyId, name: body.name, joinCode };
    await FamilyEntity.create(c.env, newFamily);
    const updatedUser: AuthUser = { ...user, familyId: newFamily.id };
    await new AuthUserEntity(c.env, user.id, 'id').save(updatedUser);
    await new AuthUserEntity(c.env, user.email, 'email').save(updatedUser);
    await new AuthUserEntity(c.env, user.token, 'token').save(updatedUser);
    return ok(c, newFamily);
  });
  protectedRoutes.post('/api/families/join', async (c) => {
    const user = c.get('user');
    const { joinCode } = await c.req.json<{ joinCode?: string }>();
    if (!isStr(joinCode)) {
      return bad(c, 'Join code is required');
    }
    const { items: allFamilies } = await FamilyEntity.list(c.env);
    const targetFamily = allFamilies.find(f => f.joinCode.toUpperCase() === joinCode.toUpperCase());
    if (!targetFamily) {
      return bad(c, 'Invalid join code');
    }
    const updatedUser: AuthUser = { ...user, familyId: targetFamily.id };
    await new AuthUserEntity(c.env, user.id, 'id').save(updatedUser);
    await new AuthUserEntity(c.env, user.email, 'email').save(updatedUser);
    await new AuthUserEntity(c.env, user.token, 'token').save(updatedUser);
    return ok(c, targetFamily);
  });
  // FAMILY MANAGEMENT
  protectedRoutes.get('/api/family/members', async (c) => {
    const user = c.get('user');
    if (!user.familyId) {
      return ok(c, []);
    }
    const { keys } = await c.env.AUTH_USER_EMAIL_INDEX.list();
    const allUsers: AuthUser[] = [];
    for (const key of keys) {
      const userEntity = new AuthUserEntity(c.env, key.name, 'email');
      if (await userEntity.exists()) {
        allUsers.push(await userEntity.getState());
      }
    }
    const familyMembers = allUsers
      .filter(u => u.familyId === user.familyId)
      .map(({ id, name, email }) => ({ id, name, email }));
    return ok(c, familyMembers);
  });
  protectedRoutes.post('/api/family/regenerate-code', async (c) => {
    const user = c.get('user');
    if (!user.familyId) {
      return bad(c, 'User is not in a family.');
    }
    const familyEntity = new FamilyEntity(c.env, user.familyId);
    if (!(await familyEntity.exists())) {
      return notFound(c, 'Family not found.');
    }
    const newJoinCode = crypto.randomUUID().substring(0, 8).toUpperCase();
    await familyEntity.patch({ joinCode: newJoinCode });
    const updatedFamily = await familyEntity.getState();
    return ok(c, updatedFamily);
  });
  // MEALS
  protectedRoutes.get('/api/meals', async (c) => {
    const user = c.get('user');
    if (!user.familyId) return ok(c, []);
    const dateQuery = c.req.query('date');
    const startDateQuery = c.req.query('startDate');
    const endDateQuery = c.req.query('endDate');
    const { items } = await MealEntity.list(c.env);
    const familyMeals = items.filter(m => m.familyId === user.familyId);
    if (startDateQuery && endDateQuery) {
      try {
        const startDate = parseISO(startDateQuery);
        const endDate = endOfDay(parseISO(endDateQuery));
        const filteredMeals = familyMeals.filter(meal => isWithinInterval(parseISO(meal.eatenAt), { start: startDate, end: endDate }));
        return ok(c, filteredMeals);
      } catch (e) {
        return bad(c, 'Invalid date format for range.');
      }
    }
    if (dateQuery) {
      try {
        const targetDate = parseISO(dateQuery);
        const start = startOfDay(targetDate);
        const end = endOfDay(targetDate);
        const filteredMeals = familyMeals.filter(meal => isWithinInterval(parseISO(meal.eatenAt), { start, end }));
        return ok(c, filteredMeals);
      } catch (e) {
        return bad(c, 'Invalid date format.');
      }
    }
    return ok(c, familyMeals);
  });
  protectedRoutes.post('/api/meals', async (c) => {
    const user = c.get('user');
    if (!user.familyId) return bad(c, 'You must be in a family to log a meal.');
    const body = await c.req.json<Partial<Meal>>();
    if (!body.type || !body.eatenAt) {
      return bad(c, 'Type and eatenAt are required');
    }
    const newMeal: Meal = {
      id: crypto.randomUUID(),
      familyId: user.familyId,
      userId: user.id,
      userName: user.name,
      description: body.description || '',
      type: body.type,
      customType: body.customType,
      eatenAt: body.eatenAt,
    };
    const created = await MealEntity.create(c.env, newMeal);
    return ok(c, created);
  });
  protectedRoutes.put('/api/meals/:id', async (c) => {
    const user = c.get('user');
    if (!user.familyId) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const body = await c.req.json<Partial<Meal>>();
    const mealEntity = new MealEntity(c.env, id);
    if (!(await mealEntity.exists()) || (await mealEntity.getState()).familyId !== user.familyId) {
      return notFound(c, 'Meal not found');
    }
    await mealEntity.patch(body);
    return ok(c, await mealEntity.getState());
  });
  protectedRoutes.delete('/api/meals/:id', async (c) => {
    const user = c.get('user');
    if (!user.familyId) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const mealEntity = new MealEntity(c.env, id);
    if (!(await mealEntity.exists()) || (await mealEntity.getState()).familyId !== user.familyId) {
      return notFound(c, 'Meal not found');
    }
    const deleted = await MealEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // PRESETS
  protectedRoutes.get('/api/presets', async (c) => {
    const user = c.get('user');
    if (!user.familyId) return ok(c, []);
    const { items } = await PresetEntity.list(c.env);
    const familyPresets = items.filter(p => p.familyId === user.familyId);
    return ok(c, familyPresets);
  });
  protectedRoutes.post('/api/presets', async (c) => {
    const user = c.get('user');
    if (!user.familyId) return bad(c, 'You must be in a family to create a preset.');
    const body = await c.req.json<{ name?: string }>();
    if (!body.name || !isStr(body.name)) {
      return bad(c, 'Name is required');
    }
    const newPreset: Preset = {
      id: crypto.randomUUID(),
      familyId: user.familyId,
      name: body.name,
    };
    const created = await PresetEntity.create(c.env, newPreset);
    return ok(c, created);
  });
  protectedRoutes.delete('/api/presets/:id', async (c) => {
    const user = c.get('user');
    if (!user.familyId) return bad(c, 'Unauthorized');
    const id = c.req.param('id');
    const presetEntity = new PresetEntity(c.env, id);
    if (!(await presetEntity.exists()) || (await presetEntity.getState()).familyId !== user.familyId) {
      return notFound(c, 'Preset not found');
    }
    const deleted = await PresetEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // --- ADMIN ROUTES ---
  protectedRoutes.post('/api/admin/reset-database', async (c) => {
    console.warn(`[ADMIN] Database reset initiated by user: ${c.get('user').id}`);
    try {
      const doId = c.env.GlobalDurableObject.idFromName('RESET_STUB');
      const stub = c.env.GlobalDurableObject.get(doId);
      await stub.deleteAll();
      return ok(c, { message: 'Database has been reset successfully.' });
    } catch (error) {
      console.error('[ADMIN] Database reset failed:', error);
      return c.json({ success: false, error: 'Failed to reset database.' }, 500);
    }
  });
  // Mount the protected routes app onto the main app
  app.route('/', protectedRoutes);
};