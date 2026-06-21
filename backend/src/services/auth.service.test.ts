import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/users.repository.js', () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    findById: vi.fn(),
    insert: vi.fn(),
    newId: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

vi.mock('jsonwebtoken', () => ({
  default: { sign: vi.fn() },
}));

vi.mock('../config/env.js', () => ({ JWT_SECRET: 'test-secret' }));

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/users.repository.js';
import type { User } from '../types/user.js';
import { ApiError } from '../utils/api-response.js';
import { authService } from './auth.service.js';

const sampleUser: User = {
  id: 'user-1',
  username: 'rosen',
  email: 'rosen@example.com',
  passwordHash: 'hashed-password',
  createdAt: '2023-01-15T10:00:00.000Z',
  updatedAt: '2023-01-15T10:00:00.000Z',
};

const registerDto = { username: 'rosen', email: 'rosen@example.com', password: 'password123' };
const loginDto = { email: 'rosen@example.com', password: 'password123' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService.register', () => {
  it('throws ApiError(409, EMAIL_TAKEN) when the email is already registered', async () => {
    vi.mocked(userRepository.findByEmail).mockReturnValue(sampleUser);
    await expect(authService.register(registerDto)).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
    });
    expect(userRepository.insert).not.toHaveBeenCalled();
  });

  it('throws ApiError(409, USERNAME_TAKEN) when the username is already taken', async () => {
    vi.mocked(userRepository.findByEmail).mockReturnValue(undefined);
    vi.mocked(userRepository.findByUsername).mockReturnValue(sampleUser);
    await expect(authService.register(registerDto)).rejects.toMatchObject({
      status: 409,
      code: 'USERNAME_TAKEN',
    });
    expect(userRepository.insert).not.toHaveBeenCalled();
  });

  it('hashes the password, inserts the user, and returns a public user + token', async () => {
    vi.mocked(userRepository.findByEmail).mockReturnValue(undefined);
    vi.mocked(userRepository.findByUsername).mockReturnValue(undefined);
    vi.mocked(userRepository.newId).mockReturnValue('user-1');
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    vi.mocked(userRepository.insert).mockReturnValue(sampleUser);
    vi.mocked(jwt.sign).mockReturnValue('signed-token' as never);

    const result = await authService.register(registerDto);

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(userRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        username: 'rosen',
        email: 'rosen@example.com',
        passwordHash: 'hashed-password',
      }),
    );
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'user-1' }, 'test-secret', { expiresIn: '7d' });
    expect(result).toEqual({
      user: { id: 'user-1', username: 'rosen', email: 'rosen@example.com' },
      token: 'signed-token',
    });
  });

  it('never includes passwordHash in the returned user', async () => {
    vi.mocked(userRepository.findByEmail).mockReturnValue(undefined);
    vi.mocked(userRepository.findByUsername).mockReturnValue(undefined);
    vi.mocked(userRepository.newId).mockReturnValue('user-1');
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    vi.mocked(userRepository.insert).mockReturnValue(sampleUser);
    vi.mocked(jwt.sign).mockReturnValue('signed-token' as never);

    const result = await authService.register(registerDto);
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});

describe('authService.login', () => {
  it('throws ApiError(401, INVALID_CREDENTIALS) when the email is unknown', async () => {
    vi.mocked(userRepository.findByEmail).mockReturnValue(undefined);
    await expect(authService.login(loginDto)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  });

  it('throws ApiError(401, INVALID_CREDENTIALS) when the password is wrong', async () => {
    vi.mocked(userRepository.findByEmail).mockReturnValue(sampleUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    await expect(authService.login(loginDto)).rejects.toMatchObject({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  });

  it('unknown-email and wrong-password rejections are identical, so neither leaks which check failed', async () => {
    vi.mocked(userRepository.findByEmail).mockReturnValue(undefined);
    let unknownEmailError: ApiError | undefined;
    try {
      await authService.login(loginDto);
    } catch (err) {
      unknownEmailError = err as ApiError;
    }

    vi.mocked(userRepository.findByEmail).mockReturnValue(sampleUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    let wrongPasswordError: ApiError | undefined;
    try {
      await authService.login(loginDto);
    } catch (err) {
      wrongPasswordError = err as ApiError;
    }

    expect(unknownEmailError).toBeInstanceOf(ApiError);
    expect(wrongPasswordError).toBeInstanceOf(ApiError);
    expect(unknownEmailError?.status).toBe(wrongPasswordError?.status);
    expect(unknownEmailError?.code).toBe(wrongPasswordError?.code);
    expect(unknownEmailError?.message).toBe(wrongPasswordError?.message);
  });

  it('returns a public user + token on valid credentials', async () => {
    vi.mocked(userRepository.findByEmail).mockReturnValue(sampleUser);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(jwt.sign).mockReturnValue('signed-token' as never);

    const result = await authService.login(loginDto);

    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    expect(result).toEqual({
      user: { id: 'user-1', username: 'rosen', email: 'rosen@example.com' },
      token: 'signed-token',
    });
  });
});
