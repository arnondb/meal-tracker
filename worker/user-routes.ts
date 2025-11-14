import { Hono } from 'hono';
import type { Env } from './core-utils';
import { AuthUserEntity, FamilyEntity, MealEntity, PresetEntity } from "./entities";
import { ok, bad, notFound, isStr, Index } from './core-utils';
import { AuthUser, Family, Meal, Preset } from "@shared/types";
import { startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import { authMiddleware, AuthVariables } from './auth';
// --- HELPERS ---
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
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
    const hashedPassword = await hashPassword(body.password);
    const newUser: AuthUser = {
      id: userId,
      name: body.name,
      email: body.email,
      password: hashedPassword,
      familyId: null,
      token: token,
    };
    await new AuthUserEntity(c.env, userId, 'id').save(newUser);
    await new AuthUserEntity(c.env, body.email, 'email').save(newUser);
    await new AuthUserEntity(c.env, token, 'token').save(newUser);
    await new Index(c.env, AuthUserEntity.indexName).add(userId);
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
    if (!user.password) {
      // Handle legacy users without a password hash
      return bad(c, 'Account requires a password reset. Please use "Forgot Password".');
    }
    const isPasswordValid = await verifyPassword(body.password, user.password);
    if (!isPasswordValid) {
      return bad(c, 'Invalid credentials');
    }
    return ok(c, { token: user.token });
  });
  app.post('/api/auth/forgot-password', async (c) => {
    const { email } = await c.req.json<{ email?: string }>();
    if (!isStr(email)) {
      return bad(c, 'Email is required.');
    }
    const userEntity = new AuthUserEntity(c.env, email, 'email');
    if (!(await userEntity.exists())) {
      // Don't reveal if user exists for security, but for demo we can be explicit
      return notFound(c, 'No account found with that email.');
    }
    const user = await userEntity.getState();
    const resetToken = crypto.randomUUID();
    const resetTokenExpires = Date.now() + 3600000; // 1 hour from now
    const updatedUser: AuthUser = { ...user, resetToken, resetTokenExpires };
    // Update user record in all indexed locations
    await new AuthUserEntity(c.env, user.id, 'id').save(updatedUser);
    await new AuthUserEntity(c.env, user.email, 'email').save(updatedUser);
    await new AuthUserEntity(c.env, user.token, 'token').save(updatedUser);
    // In a real app, you would email this token. For this demo, we return it.
    return ok(c, { resetToken });
  });
  app.post('/api/auth/reset-password', async (c) => {
    const { token, password } = await c.req.json<{ token?: string; password?: string }>();
    if (!isStr(token) || !isStr(password)) {
      return bad(c, 'Token and new password are required.');
    }
    if (password.length < 6) {
      return bad(c, 'Password must be at least 6 characters.');
    }
    const { items: allUsers } = await AuthUserEntity.list(c.env);
    const targetUser = allUsers.find(u => u.resetToken === token);
    if (!targetUser || !targetUser.resetTokenExpires || targetUser.resetTokenExpires < Date.now()) {
      return bad(c, 'Password reset token is invalid or has expired.');
    }
    const hashedPassword = await hashPassword(password);
    const updatedUser: AuthUser = {
      ...targetUser,
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpires: undefined,
    };
    await new AuthUserEntity(c.env, targetUser.id, 'id').save(updatedUser);
    await new AuthUserEntity(c.env, targetUser.email, 'email').save(updatedUser);
    await new AuthUserEntity(c.env, targetUser.token, 'token').save(updatedUser);
    return ok(c, { message: 'Password has been reset successfully.' });
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
    // Omit password from response
    const { password, ...safeUser } = user;
    return ok(c, { user: safeUser, family });
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
    const { password, ...safeUser } = updatedUser;
    return ok(c, safeUser);
  });
  protectedRoutes.delete('/api/auth/me', async (c) => {
    const user = c.get('user');
    // If user is in a family, remove them from the member list
    if (user.familyId) {
      const familyEntity = new FamilyEntity(c.env, user.familyId);
      if (await familyEntity.exists()) {
        const family = await familyEntity.getState();
        const updatedMemberIds = family.memberIds.filter(id => id !== user.id);
        await familyEntity.patch({ memberIds: updatedMemberIds });
      }
    }
    await AuthUserEntity.deleteUser(c.env, user);
    return ok(c, { message: 'Account deleted successfully' });
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
    const newFamily: Family = { id: familyId, name: body.name, joinCode, memberIds: [user.id] };
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
    if (user.familyId) {
      return bad(c, 'User is already in a family.');
    }
    const familyEntity = new FamilyEntity(c.env, targetFamily.id);
    const updatedMemberIds = [...(targetFamily.memberIds || []), user.id];
    await familyEntity.patch({ memberIds: updatedMemberIds });
    const updatedUser: AuthUser = { ...user, familyId: targetFamily.id };
    await new AuthUserEntity(c.env, user.id, 'id').save(updatedUser);
    await new AuthUserEntity(c.env, user.email, 'email').save(updatedUser);
    await new AuthUserEntity(c.env, user.token, 'token').save(updatedUser);
    return ok(c, await familyEntity.getState());
  });
  // FAMILY MANAGEMENT
  protectedRoutes.get('/api/family/members', async (c) => {
    const user = c.get('user');
    if (!user.familyId) {
      return ok(c, []);
    }
    const familyEntity = new FamilyEntity(c.env, user.familyId);
    if (!(await familyEntity.exists())) {
      return ok(c, []); // Family doesn't exist, so no members
    }
    const family = await familyEntity.getState();
    const memberIds = family.memberIds || [];
    const memberPromises = memberIds.map(async (id) => {
      const memberEntity = new AuthUserEntity(c.env, id, 'id');
      if (await memberEntity.exists()) {
        const member = await memberEntity.getState();
        return { id: member.id, name: member.name, email: member.email };
      }
      return null;
    });
    const familyMembers = (await Promise.all(memberPromises)).filter(Boolean);
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
  protectedRoutes.delete('/api/family', async (c) => {
    const user = c.get('user');
    const familyId = user.familyId;
    if (!familyId) {
      return bad(c, 'User is not in a family.');
    }
    // 1. Find all members of the family
    const { items: allUsers } = await AuthUserEntity.list(c.env);
    const familyMembers = allUsers.filter(u => u.familyId === familyId);
    // 2. Find all meals and presets for the family
    const { items: allMeals } = await MealEntity.list(c.env);
    const familyMeals = allMeals.filter(m => m.familyId === familyId);
    const { items: allPresets } = await PresetEntity.list(c.env);
    const familyPresets = allPresets.filter(p => p.familyId === familyId);
    // 3. Delete all associated data
    await Promise.all([
      ...familyMeals.map(m => MealEntity.delete(c.env, m.id)),
      ...familyPresets.map(p => PresetEntity.delete(c.env, p.id)),
      ...familyMembers.map(member => AuthUserEntity.deleteUser(c.env, member)),
      FamilyEntity.delete(c.env, familyId)
    ]);
    return ok(c, { message: 'Family and all associated data deleted successfully.' });
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