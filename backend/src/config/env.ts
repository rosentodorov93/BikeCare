const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error(
    'JWT_SECRET environment variable is required. Set it in backend/.env or your shell before starting the server.',
  );
}

export const JWT_SECRET = secret;
