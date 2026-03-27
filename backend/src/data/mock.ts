import type { ConversionStage } from "../types.js";

export const mockUsers = [
  {
    id: "u-admin-1",
    email: "admin@teksys.in",
    fullName: "Teksys BIM Admin",
    roles: ["ADMIN"],
    organizationId: "org-internal",
    password: "Admin@1234",
  },
  {
    id: "u-manager-1",
    email: "manager@teksys.in",
    fullName: "BIM Manager",
    roles: ["BIM_MANAGER"],
    organizationId: "org-internal",
    password: "Manager@1234",
  },
];

export const mockProjects = [
  {
    id: "p-1",
    code: "TKS-BIM-001",
    name: "Aishwaryam Signature - CAD2BIM",
    location: "Hyderabad",
    status: "ACTIVE",
    clientName: "Aishwaryam Group",
    createdAt: "2026-03-20T09:00:00.000Z",
  },
];

export const mockConversionRequests: Array<{
  id: string;
  projectId: string;
  title: string;
  stage: ConversionStage;
  dueDate: string;
  assignee: string;
}> = [
  {
    id: "cr-1",
    projectId: "p-1",
    title: "Tower-A Architectural CAD2BIM",
    stage: "UNDER_REVIEW",
    dueDate: "2026-04-10T00:00:00.000Z",
    assignee: "BIM Manager",
  },
  {
    id: "cr-2",
    projectId: "p-1",
    title: "Tower-A Structural Conversion",
    stage: "IN_CONVERSION",
    dueDate: "2026-04-14T00:00:00.000Z",
    assignee: "BIM Engineer Team",
  },
];

export const mockFiles = [
  {
    id: "f-1",
    projectId: "p-1",
    originalName: "TowerA_Arch_Rev03.dwg",
    category: "SOURCE_CAD",
    status: "READY",
    createdAt: "2026-03-21T09:15:00.000Z",
  },
  {
    id: "f-2",
    projectId: "p-1",
    originalName: "TowerA_Structure.pdf",
    category: "SOURCE_DOC",
    status: "READY",
    createdAt: "2026-03-21T10:05:00.000Z",
  },
];
