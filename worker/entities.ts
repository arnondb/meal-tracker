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
}
export class FamilyEntity extends IndexedEntity<Family> {
  static readonly entityName = "family";
  static readonly indexName = "families";
  static readonly initialState: Family = { id: "", joinCode: "" };
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