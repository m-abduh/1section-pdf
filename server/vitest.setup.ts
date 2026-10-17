process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/section_test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-please-change-123456";
process.env.PADDLE_API_KEY = process.env.PADDLE_API_KEY ?? "test_paddle_key";
process.env.PADDLE_WEBHOOK_SECRET =
  process.env.PADDLE_WEBHOOK_SECRET ?? "test_paddle_webhook_secret";
process.env.RATE_LIMIT_DISABLED = process.env.RATE_LIMIT_DISABLED ?? "true";
process.env.EMAIL_PROVIDER = process.env.EMAIL_PROVIDER ?? "log";
