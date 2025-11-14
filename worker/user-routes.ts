import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, MealEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import { Meal } from "@shared/types";
import { startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
  // MEALS
  app.get('/api/meals', async (c) => {
    const dateQuery = c.req.query('date'); // Expects YYYY-MM-DD
    const startDateQuery = c.req.query('startDate'); // Expects ISO String
    const endDateQuery = c.req.query('endDate'); // Expects ISO String
    const { items } = await MealEntity.list(c.env);
    if (startDateQuery && endDateQuery) {
      try {
        const startDate = parseISO(startDateQuery);
        const endDate = parseISO(endDateQuery);
        const filteredMeals = items.filter(meal => {
          const mealDate = parseISO(meal.eatenAt);
          return isWithinInterval(mealDate, { start: startDate, end: endDate });
        });
        return ok(c, filteredMeals);
      } catch (e) {
        return bad(c, 'Invalid date format for range. Please use ISO 8601 format.');
      }
    }
    if (dateQuery) {
      try {
        const targetDate = parseISO(dateQuery);
        const start = startOfDay(targetDate);
        const end = endOfDay(targetDate);
        const filteredMeals = items.filter(meal => {
          const mealDate = parseISO(meal.eatenAt);
          return isWithinInterval(mealDate, { start, end });
        });
        return ok(c, filteredMeals);
      } catch (e) {
        return bad(c, 'Invalid date format. Please use YYYY-MM-DD.');
      }
    }
    return ok(c, items);
  });
  app.post('/api/meals', async (c) => {
    const body = await c.req.json<Partial<Meal>>();
    if (!body.description || !body.type || !body.eatenAt) {
      return bad(c, 'description, type, and eatenAt are required');
    }
    const newMeal: Meal = {
      id: crypto.randomUUID(),
      description: body.description,
      type: body.type,
      customType: body.customType,
      eatenAt: body.eatenAt,
    };
    const created = await MealEntity.create(c.env, newMeal);
    return ok(c, created);
  });
  app.put('/api/meals/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<Meal>>();
    const mealEntity = new MealEntity(c.env, id);
    if (!(await mealEntity.exists())) {
      return notFound(c, 'Meal not found');
    }
    await mealEntity.patch(body);
    return ok(c, await mealEntity.getState());
  });
  app.delete('/api/meals/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = await MealEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // USERS
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    return ok(c, await UserEntity.create(c.env, { id: crypto.randomUUID(), name: name.trim() }));
  });
  // CHATS
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await ChatBoardEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/chats', async (c) => {
    const { title } = (await c.req.json()) as { title?: string };
    if (!title?.trim()) return bad(c, 'title required');
    const created = await ChatBoardEntity.create(c.env, { id: crypto.randomUUID(), title: title.trim(), messages: [] });
    return ok(c, { id: created.id, title: created.title });
  });
  // MESSAGES
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.listMessages());
  });
  app.post('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const { userId, text } = (await c.req.json()) as { userId?: string; text?: string };
    if (!isStr(userId) || !text?.trim()) return bad(c, 'userId and text required');
    const chat = new ChatBoardEntity(c.env, chatId);
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.sendMessage(userId, text.trim()));
  });
  // DELETE: Users
  app.delete('/api/users/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await UserEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/users/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await UserEntity.deleteMany(c.env, list), ids: list });
  });
  // DELETE: Chats
  app.delete('/api/chats/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await ChatBoardEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/chats/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await ChatBoardEntity.deleteMany(c.env, list), ids: list });
  });
}