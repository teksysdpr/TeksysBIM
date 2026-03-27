import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(8401),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(12),
  JWT_EXPIRES_IN: z.string().default("1h"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  USE_IN_MEMORY: z.string().default("true"),
  MAX_UPLOAD_MB: z.coerce.number().default(100),
  UPLOAD_DRIVER: z.string().default("local"),
  UPLOAD_LOCAL_DIR: z.string().default("storage/uploads"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  useInMemory: env.USE_IN_MEMORY === "true",
  maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
  uploadDriver: env.UPLOAD_DRIVER,
  uploadLocalDir: env.UPLOAD_LOCAL_DIR,
  databaseUrl: env.DATABASE_URL,
};
