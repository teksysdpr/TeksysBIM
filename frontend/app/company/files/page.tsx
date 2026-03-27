import BimModulePage from "@/app/components/company/BimModulePage";

export default function FilesPage() {
  return (
    <BimModulePage
      title="File Upload Center"
      subtitle="Upload source and deliverable files with format validation, version control, and structured storage."
      points={[
        "Supports DWG, PDF, IFC, RVT, NWC, NWD, XLSX, DOCX, ZIP.",
        "Track file version history with uploader, timestamp, and checksum metadata.",
        "Link uploaded files directly to conversion requests and deliverables.",
        "Use filters by project, category, date, and status.",
      ]}
    />
  );
}

