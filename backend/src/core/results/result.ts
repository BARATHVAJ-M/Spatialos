import { AppError } from '../errors/app-error';

export type Result<T, E = AppError> =
  | { readonly ok: true; readonly value: T; readonly error?: never }
  | { readonly ok: false; readonly value?: never; readonly error: E };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
  },
  fail<E = AppError>(error: E): Result<never, E> {
    return { ok: false, error };
  },
};
