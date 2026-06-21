import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import type { LoginDto, RegisterDto } from '../controllers/auth.controller.js';
import { userRepository } from '../repositories/users.repository.js';
import type { PublicUser, User } from '../types/user.js';
import { toPublicUser } from '../types/user.js';
import { ApiError } from '../utils/api-response.js';

const PASSWORD_SALT_ROUNDS = 10;
const TOKEN_TTL = '7d';

function issueToken(user: User): string {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Business logic for authentication. Owns id/timestamp generation and the
// uniqueness/credential rules that decide which ApiError gets thrown.
export const authService = {
  async register(dto: RegisterDto): Promise<{ user: PublicUser; token: string }> {
    if (userRepository.findByEmail(dto.email)) {
      throw new ApiError(409, 'EMAIL_TAKEN', 'Email is already registered');
    }
    if (userRepository.findByUsername(dto.username)) {
      throw new ApiError(409, 'USERNAME_TAKEN', 'Username is already taken');
    }

    const now = new Date().toISOString();
    const user: User = {
      id: userRepository.newId(),
      username: dto.username,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS),
      createdAt: now,
      updatedAt: now,
    };

    const inserted = userRepository.insert(user);
    return { user: toPublicUser(inserted), token: issueToken(inserted) };
  },

  async login(dto: LoginDto): Promise<{ user: PublicUser; token: string }> {
    const user = userRepository.findByEmail(dto.email);
    // Same ApiError whether the email is unknown or the password is wrong -
    // never reveal which check failed.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    return { user: toPublicUser(user), token: issueToken(user) };
  },
};
