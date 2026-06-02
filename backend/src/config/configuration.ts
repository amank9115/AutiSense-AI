export interface IConfig {
  database: {
    url: string;
  };
  server: {
    port: number;
    nodeEnv: 'development' | 'production' | 'test';
    jwtSecret: string;
    jwtExpiry: string;
    refreshTokenExpiry: string;
    allowedOrigins: string[];
  };
  mlService: {
    enabled: boolean;
    baseUrl: string;
    timeoutMs: number;
  };
  aiEngine: {
    enabled: boolean;
    baseUrl: string;
    timeoutMs: number;
  };
  redis: {
    host: string;
    port: number;
  };
  email: {
    resendApiKey?: string;
    from: string;
  };
  groq: {
    apiKey?: string;
  };
  ollama: {
    baseUrl: string;
  };
}

export const configuration = (): IConfig => {
  const jwtSecret = process.env.JWT_SECRET;

  // Validate JWT_SECRET in production to prevent deployment without proper secrets
  if (process.env.NODE_ENV === 'production' && (!jwtSecret || jwtSecret.includes('dev-secret') || jwtSecret.length < 32)) {
    throw new Error('JWT_SECRET must be set and be at least 32 characters in production. Use a cryptographically secure random string.');
  }

  return {
    database: {
      url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/autism_screening',
    },
    server: {
      port: parseInt(process.env.PORT ?? '3000', 10),
      nodeEnv: (process.env.NODE_ENV ?? 'development') as
        | 'development'
        | 'production'
        | 'test',
      jwtSecret: jwtSecret || 'dev-only-secret-do-not-use-in-production-32ch',
      jwtExpiry: process.env.JWT_EXPIRY ?? '24h',
      refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY ?? '7d',
      allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000,http://localhost:3001,http://localhost:4000')
        .split(',')
        .map(origin => origin.trim()),
    },
    mlService: {
      enabled: process.env.PY_ML_ENABLED === 'true',
      baseUrl: process.env.PY_ML_BASE_URL ?? 'http://127.0.0.1:8001',
      timeoutMs: parseInt(process.env.PY_ML_TIMEOUT_MS ?? '2500', 10),
    },
    aiEngine: {
      enabled: process.env.AI_ENGINE_ENABLED === 'true',
      baseUrl: process.env.AI_ENGINE_BASE_URL ?? 'http://127.0.0.1:5000',
      timeoutMs: parseInt(process.env.AI_ENGINE_TIMEOUT_MS ?? '3500', 10),
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    },
    email: {
      resendApiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? 'AutiSense <noreply@autisense.ai>',
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY,
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    },
  };
};