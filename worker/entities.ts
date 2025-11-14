import { IndexedEntity, Entity } from "./core-utils";
import type { AuthUser, Family, Meal, Preset } from "@shared/types";
// AUTH USER ENTITY
export class AuthUserEntity extends IndexedEntity<AuthUser> {
  static readonly entityName = "authUser";
  static readonly indexName = "authUsers";
  static readonly initialState: AuthUser = { id: "", name: "", email: "", familyId: null, token: "" };
  // Allow lookup by email or token
  constructor(env: Env, id: string, key: 'id' | 'email' | 'token' = 'id') {
    let entityId = id;
    if (key === 'email') {
      entityId = `email:${id}`;
    } else if (key === 'token') {
      entityId = `token:${id}`;
    }
    super(env, entityId);
  }
  static keyOf(state: AuthUser): string {
    return state.id;
  }
}
// FAMILY ENTITY
export class FamilyEntity extends Entity<Family> {
  static readonly entityName = "family";
  static readonly initialState: Family = { id: "", joinCode: "" };
}
// MEAL ENTITY
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
    eatenAt: new Date().toISOString(),
  };
}
// PRESET ENTITY
export class PresetEntity extends IndexedEntity<Preset> {
  static readonly entityName = "preset";
  static readonly indexName = "presets";
  static readonly initialState: Preset = { id: "", familyId: "", name: "" };
}