// ── Command pattern for future undo/redo ──────────────────────────────────────
// Phase 3: types only. Execution engine in Phase 4.
// All mutations to scene entities must go through commands.
// This ensures: undo/redo, audit trail, server sync, dirty tracking.

export interface BimCommand {
  readonly id: string;         // UUID, unique per execution
  readonly type: CommandType;
  readonly description: string; // human-readable for history panel
  readonly timestamp: number;
  execute(): void;
  undo(): void;
}

export type CommandType =
  | "MOVE_ENTITY"
  | "RENAME_ENTITY"
  | "SET_PROPERTY"
  | "SET_VISIBILITY"
  | "ADD_ENTITY"
  | "REMOVE_ENTITY"
  | "REPARENT_ENTITY"
  | "RESIZE_GEOMETRY"
  | "TRANSLATE_GEOMETRY"
  | "BATCH";

// ── Batch command ─────────────────────────────────────────────────────────────
// Wraps multiple commands into a single undo-able unit.

export interface BatchCommand extends BimCommand {
  readonly type: "BATCH";
  readonly commands: BimCommand[];
}

// ── Concrete command payloads ─────────────────────────────────────────────────
// Payloads hold the before/after state needed for undo.

export interface MoveEntityPayload {
  entityId: string;
  from: [number, number, number];
  to: [number, number, number];
}

export interface SetPropertyPayload {
  entityId: string;
  key: string;
  from: unknown;
  to: unknown;
}

export interface SetVisibilityPayload {
  entityId: string;
  from: boolean;
  to: boolean;
}

export interface AddEntityPayload {
  entity: import("./model").BimEntity;
}

export interface RemoveEntityPayload {
  entityId: string;
  snapshot: import("./model").BimEntity; // full entity snapshot for undo
}

// ── Command factory interface ─────────────────────────────────────────────────
// Phase 4 will implement these via concrete CommandFactory class.

export interface CommandFactory {
  moveEntity(payload: MoveEntityPayload): BimCommand;
  setProperty(payload: SetPropertyPayload): BimCommand;
  setVisibility(payload: SetVisibilityPayload): BimCommand;
  addEntity(payload: AddEntityPayload): BimCommand;
  removeEntity(payload: RemoveEntityPayload): BimCommand;
  batch(commands: BimCommand[], description: string): BatchCommand;
}
