// ── Library base types ─────────────────────────────────────────────────────────
//
// Kept in a separate file to prevent circular imports between wallTypes.ts
// (which defines Material, WallType etc.) and libraryTypes.ts (which imports
// from wallTypes.ts). Both files import LibraryEntityBase from here.
//
// Import order:
//   libraryBase  ← wallTypes  ← libraryTypes
//                              ← libraryStore
//                              ← systemLibrary

// ── Scope ─────────────────────────────────────────────────────────────────────
// Where a library entity originates:
//   SYSTEM  — shipped with TeksysBIM; read-only for users
//   COMPANY — created at company/organisation level; shared across projects
//   PROJECT — created for a specific project; private to that project

export type LibraryScope = "SYSTEM" | "COMPANY" | "PROJECT";

// ── Status ────────────────────────────────────────────────────────────────────
// Lifecycle state of a library entity:
//   DRAFT    — being authored, not yet visible in pickers
//   ACTIVE   — published, available for use in models
//   ARCHIVED — retired, hidden from pickers but preserved for history

export type LibraryEntityStatus = "ACTIVE" | "ARCHIVED" | "DRAFT";

// ── Base interface ────────────────────────────────────────────────────────────
// Every named, reusable item in any BIM library section extends this.
//
// Fields are deliberately minimal — each concrete type adds domain-specific
// properties on top.

export interface LibraryEntityBase {
  /** Stable unique identifier (UUID or prefixed slug) */
  id: string;
  /** Short unique code used in schedules and exports, e.g. "MAT-RBB", "RBW-230-P" */
  code: string;
  /** Human-readable display name */
  name: string;
  /** Optional longer description for documentation / tooltips */
  description?: string;
  /** Free-form tags for search and filtering */
  tags: string[];
  /** Where this definition lives */
  scope: LibraryScope;
  /** Set when scope === "PROJECT" */
  projectId?: string;
  /** Set when scope === "COMPANY" */
  companyId?: string;
  /** Lifecycle status */
  status: LibraryEntityStatus;
  /**
   * True for SYSTEM-scope built-in items — these cannot be deleted or
   * fundamentally altered by users (only company/project overrides are allowed).
   */
  isBuiltIn: boolean;
  /** ISO-8601 creation timestamp */
  createdAt?: string;
  /** ISO-8601 last-update timestamp */
  updatedAt?: string;
  /**
   * Extensible key-value bag for user-defined or integration-specific fields.
   * Mirrors the IFC Pset concept for library-level metadata.
   */
  metadata: Record<string, string | number | boolean | null>;
}
