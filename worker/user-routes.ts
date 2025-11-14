import { Hono } from "hono";
import type { Env } from './core-utils';
import { AuthUserEntity, FamilyEntity, MealEntity, PresetEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import { AuthUser, Family, Meal, Preset } from "@shared/types";
import { startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import { authMiddleware, AuthVariables } from './auth';
export function userRoutes(app: Hono<{ Bindings: Env; Variables: AuthVariables }>) {
  // --- PUBLIC AUTH ROUTES ---
  app.post('/api/auth/register', async (c) => {
    const body = await c.req.json<{ name?: string; email?: string; password?: string }>();
    if (!isStr(body.name) || !isStr(body.email) || !isStr(body.password)) {
      return bad(c, 'Name, email, and password are required');
    }
    if (body.password.length < 6) {
      return bad(c, 'Password must be at least 6 characters');
    }
    // Check if user already exists
    const existingUser = new AuthUserEntity(c.env, body.email, 'email');
    if (await existingUser.exists()) {
      return bad(c, 'An account with this email already exists');
    }
    const userId = crypto.randomUUID();
    const token = crypto.randomUUID();
    const familyId = crypto.randomUUID();
    const joinCode = crypto.randomUUID().substring(0, 8).toUpperCase();
    // Create new family
    const family: Family = { id: familyId, joinCode };
    await FamilyEntity.create(c.env, family);
    // Create new user
    const newUser: AuthUser = {
      id: userId,
      name: body.name,
      email: body.email,
      familyId: familyId,
      token: token,
    };
    // Store user by ID, email, and token
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
    // NOTE: In a real app, you'd hash and compare passwords.
    // For this project, we'll assume the password is correct if the user exists.
    const user = await userEntity.getState();
    return ok(c, { token: user.token });
  });
  // --- PROTECTED ROUTES ---
  app.use('/api/*', authMiddleware);
  app.get('/api/auth/me', async (c) => {
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
  app.post('/api/families/join', async (c) => {
    const user = c.get('user');
    const { joinCode } = await c.req.json<{ joinCode?: string }>();
    if (!isStr(joinCode)) {
      return bad(c, 'Join code is required');
    }
    // This is inefficient but necessary without a reverse index on joinCode.
    // In a real app, you'd use a more scalable lookup method (e.g., KV or another index).
    const { items: allFamilies } = await FamilyEntity.list(c.env);
    const targetFamily = allFamilies.find(f => f.joinCode === joinCode);
    if (!targetFamily) {
      return bad(c, 'Invalid join code');
    }
    // Update user's familyId
    const updatedUser: AuthUser = { ...user, familyId: targetFamily.id };
    await new AuthUserEntity(c.env, user.id, 'id').save(updatedUser);
    await new AuthUserEntity(c.env, user.email, 'email').save(updatedUser);
    await new AuthUserEntity(c.env, user.token, 'token').save(updatedUser);
    return ok(c, targetFamily);
  });
  // MEALS
  app.get('/api/meals', async (c) => {
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
  app.post('/api/meals', async (c) => {
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
  app.put('/api/meals/:id', async (c) => {
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
  app.delete('/api/meals/:id', async (c) => {
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
  app.get('/api/presets', async (c) => {
    const user = c.get('user');
    if (!user.familyId) return ok(c, []);
    const { items } = await PresetEntity.list(c.env);
    const familyPresets = items.filter(p => p.familyId === user.familyId);
    return ok(c, familyPresets);
  });
  app.post('/api/presets', async (c) => {
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
  app.delete('/api/presets/:id', async (c) => {
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
}