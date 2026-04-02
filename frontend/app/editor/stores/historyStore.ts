// ── History store ─────────────────────────────────────────────────────────────
// Undo/redo command stack.
// Phase 3: store scaffolding + log-only push.
// Phase 4: full execute/undo wiring via CommandFactory.

import { create } from "zustand";
import type { BimCommand } from "../types/commands";

const MAX_HISTORY = 100;

interface HistoryEntry {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  command?: BimCommand; // undefined for log-only entries
}

interface HistoryState {
  entries: HistoryEntry[];

  /** Points to index of the last executed entry. -1 = nothing executed. */
  cursor: number;

  canUndo: boolean;
  canRedo: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────

  /** Push and execute a command */
  push: (command: BimCommand) => void;

  /** Log a description without a command object (for read-only actions) */
  logEntry: (description: string, type?: string) => void;

  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  entries: [],
  cursor: -1,
  canUndo: false,
  canRedo: false,

  push: (command) => {
    command.execute();
    set((s) => {
      // Truncate redo stack
      const kept = s.entries.slice(0, s.cursor + 1);
      const next: HistoryEntry[] = [
        ...kept,
        {
          id: command.id,
          type: command.type,
          description: command.description,
          timestamp: command.timestamp,
          command,
        },
      ].slice(-MAX_HISTORY);
      const cursor = next.length - 1;
      return { entries: next, cursor, canUndo: cursor >= 0, canRedo: false };
    });
  },

  logEntry: (description, type = "LOG") => {
    set((s) => {
      const entry: HistoryEntry = {
        id: `log-${Date.now()}`,
        type,
        description,
        timestamp: Date.now(),
      };
      const kept = s.entries.slice(0, s.cursor + 1);
      const next = [...kept, entry].slice(-MAX_HISTORY);
      const cursor = next.length - 1;
      return { entries: next, cursor, canUndo: false, canRedo: false };
    });
  },

  undo: () => {
    const { entries, cursor } = get();
    if (cursor < 0) return;
    const entry = entries[cursor];
    if (entry?.command) {
      entry.command.undo();
    }
    const newCursor = cursor - 1;
    set({ cursor: newCursor, canUndo: newCursor >= 0, canRedo: true });
  },

  redo: () => {
    const { entries, cursor } = get();
    const next = cursor + 1;
    if (next >= entries.length) return;
    const entry = entries[next];
    if (entry?.command) {
      entry.command.execute();
    }
    set({ cursor: next, canUndo: next >= 0, canRedo: next < entries.length - 1 });
  },

  clear: () => set({ entries: [], cursor: -1, canUndo: false, canRedo: false }),
}));

// ── Selectors ─────────────────────────────────────────────────────────────────

export function selectRecentEntries(
  entries: HistoryEntry[],
  cursor: number,
  count = 20
): Array<HistoryEntry & { isExecuted: boolean }> {
  return entries.slice(0, cursor + 1).slice(-count).reverse().map((e) => ({
    ...e,
    isExecuted: true,
  }));
}
