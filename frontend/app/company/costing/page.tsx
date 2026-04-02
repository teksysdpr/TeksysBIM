import { Suspense } from "react";
import ModuleProjectsClient from "@/app/components/company/modules/ModuleProjectsClient";

export default function CostingPage() {
  return (
    <Suspense>
      <ModuleProjectsClient module="COSTING" />
    </Suspense>
  );
}
