import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.js";

const notifications = [
  {
    id: "n-1",
    title: "Scope review pending",
    message: "Tower-A Architectural request needs manager review.",
    status: "UNREAD",
    createdAt: "2026-03-26T09:20:00.000Z",
  },
  {
    id: "n-2",
    title: "Clash report uploaded",
    message: "Architectural vs MEP clash report is ready for action.",
    status: "READ",
    createdAt: "2026-03-25T17:35:00.000Z",
  },
];

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, (_req, res) => {
  res.json({ data: notifications });
});
