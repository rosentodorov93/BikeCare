// Shared response envelope helpers so every endpoint has the same success/error shape.

export const ok = <T>(data: T) => ({ data });

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
