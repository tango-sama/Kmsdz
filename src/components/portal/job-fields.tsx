import type { Job } from "@/lib/portal/jobs";
import type { PortalDict } from "@/i18n/portal";
import { JOB_PRIORITIES, JOB_STATUSES } from "@/lib/portal/types";
import { AudiencePicker } from "./audience-picker";

export function JobFields({ t, job, workers, grantIds }: { t: PortalDict; job?: Job; workers: { id: string; fullName: string; username: string }[]; grantIds?: string[] }) {
  const f = t.jobs.fields;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><label className="label" htmlFor="title">{f.title}</label><input id="title" name="title" required minLength={3} maxLength={120} defaultValue={job?.title} className="field" /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="description">{f.description}</label><textarea id="description" name="description" rows={5} maxLength={4000} defaultValue={job?.description} className="field resize-y" /></div>
      <div><label className="label" htmlFor="location">{f.location}</label><input id="location" name="location" maxLength={120} defaultValue={job?.location} className="field" /></div>
      <div><label className="label" htmlFor="client">{f.client}</label><input id="client" name="client" maxLength={120} defaultValue={job?.client} className="field" /></div>
      <div><label className="label" htmlFor="status">{f.status}</label>
        <select id="status" name="status" defaultValue={job?.status ?? "new"} className="field">{JOB_STATUSES.map((s) => <option key={s} value={s}>{t.jobs.status[s]}</option>)}</select></div>
      <div><label className="label" htmlFor="priority">{f.priority}</label>
        <select id="priority" name="priority" defaultValue={job?.priority ?? "normal"} className="field">{JOB_PRIORITIES.map((s) => <option key={s} value={s}>{t.jobs.priority[s]}</option>)}</select></div>
      <div><label className="label" htmlFor="startDate">{f.startDate}</label><input id="startDate" name="startDate" type="date" dir="ltr" defaultValue={job?.startDate ?? ""} className="field text-start" /></div>
      <div><label className="label" htmlFor="dueDate">{f.dueDate}</label><input id="dueDate" name="dueDate" type="date" dir="ltr" defaultValue={job?.dueDate ?? ""} className="field text-start" /></div>
      <div className="sm:col-span-2"><AudiencePicker workers={workers} defaultAudience={job?.audience ?? "all"} defaultIds={grantIds ?? []} /></div>
    </div>
  );
}
