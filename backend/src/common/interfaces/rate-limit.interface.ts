export const I_RATE_LIMIT_SERVICE = 'I_RATE_LIMIT_SERVICE';

export interface IRateLimitService {
  checkAuthRateLimit(identifier: string): void;
  resetAuthRateLimit(identifier: string): void;
  checkApiRateLimit(clientIp: string): void;
}
