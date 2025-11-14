import { IndexedEntity, Entity } from "./core-utils";
import type { AuthUser, Family, Meal, Preset } from "@shared/types";
import type { Env } from "./core-utils";
export class AuthUserEntity extends IndexedEntity<AuthUser> {
  static readonly entityName = "authUser";
  static readonly indexName = "authUsers";
  static readonly initialState: AuthUser = { id: "", name: "", email: "", familyId: null, token: "" };
  constructor(env: Env, id: string, key: 'id' | 'email' | 'token' = 'id') {
    let entityId = id;
    if (key === 'email') {
      entityId = `email:${id}`;
    } else if (key === 'token') {
      entityId = `token:${id}`;
    }
    super(env, entityId);
  }
  static async deleteUser(env: Env, user: AuthUser): Promise<void> {
    // This static method ensures all user-related data and indexes are cleaned up.
    const idEntity = new AuthUserEntity(env, user.id, 'id');
    const emailEntity = new AuthUserEntity(env, user.email, 'email');
    const tokenEntity = new AuthUserEntity(env, user.token, 'token');
    await Promise.all([
      idEntity.delete(),
      emailEntity.delete(),
      tokenEntity.delete(),
    ]);
    // Also remove the primary ID from the main index
    await AuthUserEntity.removeFromIndex(env, user.id);
  }
}
export class FamilyEntity extends IndexedEntity<Family> {
  static readonly entityName = "family";
  static readonly indexName = "families";
  static readonly initialState: Family = { id: "", name: "", joinCode: "" };
}
export class MealEntity extends IndexedEntity<Meal> {
  static readonly entityName = "meal";
  static readonly indexName = "meals";
  static readonly initialState: Meal = {
    id: "",
    familyId: "",
    userId: "",
    userName: "",
    description: "",
    type: "Other",
    eatenAt: new Date().toISOString()
  };
}
export class PresetEntity extends IndexedEntity<Preset> {
  static readonly entityName = "preset";
  static readonly indexName = "presets";
  static readonly initialState: Preset = { id: "", familyId: "", name: "" };
}