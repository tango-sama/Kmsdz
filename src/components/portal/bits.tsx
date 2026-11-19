import type { ReactNode } from "react";
import type { JobPriority, JobStatus } from "@/lib/portal/types";

const statusColor: Record<JobStatus, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-200",
  in_progress: "bg-brand-50 text-brand-700 ring-brand-200",
  on_hold: "bg-amber-50 text-amber-800 ring-amber-200",
  done: "bg-green-50 text-green-700 ring-green-200",
};
const prioColor: Record<JobPriority, string> = {
  normal: "bg-mist text-ink-600 ring-ink/10",
  high: "bg-amber-50 text-amber-800 ring-amber-200",
  urgent: "bg-red-50 text-red-700 ring-red-200",
};

export const Pill = ({ children, tone }: { children: ReactNode; tone: string }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${tone}`}>{children}</span>
);
export const StatusPill = ({ status, label }: { status: JobStatus; label: string }) => <Pill tone={statusColor[status]}>{label}</Pill>;
export const PriorityPill = ({ priority, label }: { priority: JobPriority; label: string }) => <Pill tone={prioColor[priority]}>{label}</Pill>;

export function PageTitle({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {lead && <p className="mt-1 text-ink-500">{lead}</p>}
      </div>
      {actions}
    </div>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-2xl border-2 border-dashed border-ink/15 bg-white p-8 text-center text-ink-500">{children}</p>
);
