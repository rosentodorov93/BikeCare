import { randomUUID } from 'node:crypto';
import { db } from '../db/connection.js';
import type { User, UserRow } from '../types/user.js';

// All SQLite access for the users table. Parameterized queries only;
// rows are mapped to domain objects at this boundary.

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const userRepository = {
  findByEmail(email: string): User | undefined {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
      | UserRow
      | undefined;
    return row ? toUser(row) : undefined;
  },

  findByUsername(username: string): User | undefined {
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
      | UserRow
      | undefined;
    return row ? toUser(row) : undefined;
  },

  findById(id: string): User | undefined {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? toUser(row) : undefined;
  },

  insert(user: User): User {
    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(user.id, user.username, user.email, user.passwordHash, user.createdAt, user.updatedAt);
    return this.findById(user.id) as User;
  },

  newId(): string {
    return randomUUID();
  },
};
