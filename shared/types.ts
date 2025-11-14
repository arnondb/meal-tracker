export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Auth & Family
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  familyId: string | null;
  token: string;
}
export interface Family {
  id: string;
  name: string;
  joinCode: string;
}
// ChronoPlate Meal type
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Other';
export interface Meal {
  id: string;
  familyId: string;
  userId: string;
  userName: string;
  description: string;
  type: MealType | string; // Allow custom strings from presets
  customType?: string;
  eatenAt: string; // ISO 8601 string
}
// ChronoPlate Preset type
export interface Preset {
  id: string;
  familyId: string;
  name: string;
}