// Domain types for the User entity, shared across service/repository layers.

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// Raw shape of a row returned by SQLite for the `users` table.
export interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

// Shape returned to the frontend - never expose passwordHash.
export interface PublicUser {
  id: string;
  username: string;
  email: string;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, username: user.username, email: user.email };
}
