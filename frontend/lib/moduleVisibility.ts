export type AppModule = {
  key: string;
  label: string;
  route: string;
  allowedCategories: string[];
};

export const APP_MODULES: AppModule[] = [
  {
    key: "company_dashboard",
    label: "Dashboard",
    route: "/company/dashboard",
    allowedCategories: ["ADMIN", "COMPANY_ADMIN"],
  },
  {
    key: "company_settings",
    label: "Company Settings",
    route: "/company/settings",
    allowedCategories: ["ADMIN", "COMPANY_ADMIN"],
  },
  {
    key: "company_subscription",
    label: "Subscription",
    route: "/company/subscription",
    allowedCategories: ["ADMIN", "COMPANY_ADMIN"],
  },
  {
    key: "schedule_approvals",
    label: "Schedule Approvals",
    route: "/company/schedule-approvals",
    allowedCategories: ["ADMIN", "COMPANY_ADMIN"],
  },
  {
    key: "dpr",
    label: "DPR",
    route: "/company/project-team",
    allowedCategories: ["ADMIN", "COMPANY_ADMIN", "PMO", "PROJECT_TEAM"],
  },
  {
    key: "planning",
    label: "Planning",
    route: "/company/pmo",
    allowedCategories: ["ADMIN", "COMPANY_ADMIN", "PMO"],
  },
];

export function getVisibleModules(category: string | null | undefined) {
  if (!category) return [];
  return APP_MODULES.filter((m) => m.allowedCategories.includes(category));
}
