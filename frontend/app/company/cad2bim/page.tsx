import { Suspense } from "react";
import ModuleProjectsClient from "@/app/components/company/modules/ModuleProjectsClient";

export default function Cad2BimPage() {
  return (
    <Suspense>
      <ModuleProjectsClient module="CAD2BIM" />
    </Suspense>
  );
}
