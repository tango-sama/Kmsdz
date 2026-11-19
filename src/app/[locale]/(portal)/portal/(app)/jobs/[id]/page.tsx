import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Download, ExternalLink, EyeOff, FileText, MapPin, User } from "lucide-react";
import { getPortalDict, fmtDate, fmtSize } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { requireActor } from "@/lib/auth/server";
import { getJob, getJobAudience } from "@/lib/portal/jobs";
import { listFiles } from "@/lib/portal/files";
import { listWorkers } from "@/lib/portal/users";
import { JOB_STATUSES } from "@/lib/portal/types";
import { ActionForm } from "@/components/portal/action-form";
import { JobFields } from "@/components/portal/job-fields";
import { PriorityPill, StatusPill } from "@/components/portal/bits";
import { deleteJobAction, jobStatusAction, updateJobAction } from "../../../actions";

export default async function JobDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const me = await requireActor(locale);
  const job = await getJob(me, id);
  if (!job) notFound(); // hidden jobs look exactly like missing ones
  const t = getPortalDict(locale);
  const base = `/${locale}/portal`;
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  const files = await listFiles(me, { jobId: job.id });
  const isAdmin = me.role === "admin";
  const [workers, grantIds] = isAdmin ? await Promise.all([listWorkers(me), getJobAudience(me, job.id)]) : [[], []];
  const today = new Date().toISOString().slice(0, 10);
  const overdue = job.dueDate && job.dueDate < today && job.status !== "done";

  return (
    <>
      <Link href={`${base}/jobs`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand"><Back className="h-4 w-4" aria-hidden />{t.jobs.title}</Link>
      <article className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={job.status} label={t.jobs.status[job.status]} />
          {job.priority !== "normal" && <PriorityPill priority={job.priority} label={t.jobs.priority[job.priority]} />}
          {overdue && <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">{t.jobs.overdue}</span>}
          {isAdmin && job.audience === "selected" && <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white"><EyeOff className="h-3 w-3" aria-hidden />{t.jobs.hiddenBadge}</span>}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{job.title}</h1>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          {job.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand" aria-hidden /><dt className="text-ink-500">{t.jobs.location}:</dt><dd className="font-bold">{job.location}</dd></div>}
          {job.client && <div className="flex items-center gap-2"><User className="h-4 w-4 text-brand" aria-hidden /><dt className="text-ink-500">{t.jobs.client}:</dt><dd className="font-bold">{job.client}</dd></div>}
          {job.startDate && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-brand" aria-hidden /><dt className="text-ink-500">{t.jobs.start}:</dt><dd className="font-bold">{fmtDate(job.startDate, locale)}</dd></div>}
          {job.dueDate && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-brand" aria-hidden /><dt className="text-ink-500">{t.jobs.due}:</dt><dd className={`font-bold ${overdue ? "text-red-600" : ""}`}>{fmtDate(job.dueDate, locale)}</dd></div>}
        </dl>
        {job.description && <p className="mt-6 whitespace-pre-wrap leading-relaxed text-ink-700">{job.description}</p>}
        <p className="mt-6 text-xs text-ink-400">{t.jobs.updated}: {fmtDate(job.updatedAt, locale, true)}</p>
      </article>

      <section className="mt-8" aria-labelledby="rel">
        <h2 id="rel" className="mb-3 text-lg font-extrabold">{t.jobs.relatedFiles}</h2>
        {files.length === 0 ? <p className="text-sm text-ink-500">{t.jobs.noRelated}</p> : (
          <ul className="space-y-3">
            {files.map((f) => (
              <li key={f.id} className="card flex flex-wrap items-center gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><FileText className="h-5 w-5" aria-hidden /></span>
                <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{f.title}</span><span className="text-xs text-ink-500"><span className="ltr-isolate">{fmtSize(f.size)}</span></span></span>
                <a href={`/api/portal/files/${f.id}`} target="_blank" rel="noopener" className="btn btn-primary !px-3 !py-2 !text-sm"><ExternalLink className="h-4 w-4" aria-hidden />{t.files.open}</a>
                <a href={`/api/portal/files/${f.id}?download=1`} className="btn btn-outline !px-3 !py-2 !text-sm"><Download className="h-4 w-4" aria-hidden />{t.files.download}</a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && (
        <section className="mt-10 rounded-3xl bg-ink/[.03] p-5 ring-1 ring-ink/10 sm:p-6" aria-labelledby="adm">
          <h2 id="adm" className="mb-5 text-lg font-extrabold">{t.jobs.adminPanel}</h2>
          <ActionForm action={jobStatusAction} className="mb-6 flex flex-wrap items-end gap-3" submitLabel={t.jobs.changeStatus} submitClassName="btn btn-dark" successMessage={t.common.saved}>
            <input type="hidden" name="id" value={job.id} />
            <div><label className="label" htmlFor="st">{t.jobs.fields.status}</label>
              <select id="st" name="status" defaultValue={job.status} className="field">{JOB_STATUSES.map((s) => <option key={s} value={s}>{t.jobs.status[s]}</option>)}</select></div>
          </ActionForm>
          <ActionForm action={updateJobAction} className="space-y-6" submitLabel={t.common.save} successMessage={t.common.saved}>
            <input type="hidden" name="id" value={job.id} />
            <JobFields t={t} job={job} workers={workers} grantIds={grantIds} />
          </ActionForm>
          <ActionForm action={deleteJobAction} className="mt-6 border-t border-ink/10 pt-5" submitLabel={t.common.delete} submitClassName="btn !bg-red-600 text-white hover:!bg-red-700" confirm={t.common.confirmDelete}>
            <input type="hidden" name="id" value={job.id} />
          </ActionForm>
        </section>
      )}
    </>
  );
}
