import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { apiRouter } from "./routes.js";
import { optionalAuth } from "./common/middleware/auth.js";
import { activityLogMiddleware } from "./common/middleware/activity-log.js";
import { errorHandler } from "./common/middleware/error-handler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(morgan("dev"));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(optionalAuth);
  app.use(activityLogMiddleware);

  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}
