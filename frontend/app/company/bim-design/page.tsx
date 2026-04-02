import { Suspense } from "react";
import ModuleProjectsClient from "@/app/components/company/modules/ModuleProjectsClient";

export default function BimDesignPage() {
  return (
    <Suspense>
      <ModuleProjectsClient module="BIM_DESIGN" />
    </Suspense>
  );
}
