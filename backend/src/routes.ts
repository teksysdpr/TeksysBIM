import { Router } from "express";
import { authRouter } from "./modules/auth/auth.controller.js";
import { projectsRouter } from "./modules/projects/projects.controller.js";
import { filesRouter } from "./modules/files/files.controller.js";
import { conversionRouter } from "./modules/conversion-requests/conversion.controller.js";
import { pipelineRouter } from "./modules/conversion-pipeline/pipeline.controller.js";
import { bimModelRouter } from "./modules/bim-model/bim-model.controller.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.controller.js";
import { adminRouter } from "./modules/admin/admin.controller.js";
import { notificationsRouter } from "./modules/notifications/notifications.controller.js";
import { takeoffRouter } from "./modules/takeoff/takeoff.controller.js";
import { costingRouter } from "./modules/costing/costing.controller.js";
import { deliverablesRouter } from "./modules/deliverables/deliverables.controller.js";
import { bimRouter } from "./modules/bim/bim-scene.controller.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "teksysbim-backend",
    ts: new Date().toISOString(),
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/files", filesRouter);
apiRouter.use("/conversion-requests", conversionRouter);
apiRouter.use("/pipeline-jobs", pipelineRouter);
apiRouter.use("/bim-elements", bimModelRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/takeoff", takeoffRouter);
apiRouter.use("/costing", costingRouter);
apiRouter.use("/", deliverablesRouter);
apiRouter.use("/bim", bimRouter);
