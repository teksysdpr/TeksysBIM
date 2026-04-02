import { AlertCircle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

/**
 * BimStateBox — loading / error / empty state renderer
 *
 * Eliminates the per-page duplication of these three UI states.
 * All three modes are implemented as a discriminated union on `type`.
 *
 * Modes:
 *
 *   loading — centred spinner with optional text
 *     <BimStateBox type="loading" />
 *     <BimStateBox type="loading" message="Fetching estimates…" />
 *
 *   error — red alert banner
 *     <BimStateBox type="error" message={error} />
 *     <BimStateBox type="error" message={error} onRetry={load} />
 *
 *   empty — centred icon + message
 *     <BimStateBox type="empty" message="No projects found." />
 *     <BimStateBox
 *       type="empty"
 *       message="No estimates for this filter."
 *       icon={<BarChart3 className="h-10 w-10" />}
 *     />
 */

type LoadingProps = {
  type: "loading";
  message?: string;
};

type ErrorProps = {
  type: "error";
  message: string;
  onRetry?: () => void;
};

type EmptyProps = {
  type: "empty";
  message: string;
  /** Icon rendered above the message. Inherit color via className on the icon. */
  icon?: ReactNode;
};

type Props = LoadingProps | ErrorProps | EmptyProps;

export function BimStateBox(props: Props) {
  // ── Loading ───────────────────────────────────────────────────────────────
  if (props.type === "loading") {
    return (
      <div className="flex items-center justify-center py-16 text-[#7a5e3e]">
        <Loader2 className="h-6 w-6 animate-spin" />
        {props.message ? (
          <span className="ml-3 text-sm">{props.message}</span>
        ) : null}
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (props.type === "error") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span className="flex-1">{props.message}</span>
        {props.onRetry ? (
          <button
            onClick={props.onRetry}
            className="ml-2 rounded border border-red-900/40 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-950/40"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {props.icon ? (
        <div className="text-[#3f2d1a]">{props.icon}</div>
      ) : null}
      <p className="text-sm text-[#7a5e3e]">{props.message}</p>
    </div>
  );
}
