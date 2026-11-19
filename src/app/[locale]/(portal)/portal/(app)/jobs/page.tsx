import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, EyeOff, MapPin, Plus } from "lucide-react";
import { getPortalDict, fmtDate } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { requireActor } from "@/lib/auth/server";
import { listJobs } from "@/lib/portal/jobs";
import { JOB_STATUSES } from "@/lib/portal/types";
import { Empty, PageTitle, PriorityPill, StatusPill } from "@/components/portal/bits";

export default async function JobsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { status } = await searchParams;
  const me = await requireActor(locale);
  const t = getPortalDict(locale);
  const base = `/${locale}/portal`;
  const jobs = await listJobs(me, { status });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageTitle title={t.jobs.title} lead={t.jobs.lead} actions={me.role === "admin" ? <Link href={`${base}/jobs/new`} className="btn btn-primary"><Plus className="h-4 w-4" aria-hidden />{t.jobs.new}</Link> : undefined} />
      <nav aria-label={t.common.filter} className="mb-5 flex flex-wrap gap-2">
        {[{ k: "", l: t.jobs.filterStatus }, ...JOB_STATUSES.map((s) => ({ k: s as string, l: t.jobs.status[s] }))].map((o) => (
          <Link key={o.k} href={o.k ? `${base}/jobs?status=${o.k}` : `${base}/jobs`} aria-current={(status || "") === o.k ? "true" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-bold ring-1 transition ${(status || "") === o.k ? "bg-ink text-white ring-ink" : "bg-white text-ink-600 ring-ink/10 hover:ring-brand"}`}>{o.l}</Link>
        ))}
      </nav>
      {jobs.length === 0 ? <Empty>{t.jobs.empty}</Empty> : (
        <ul className="space-y-3">
          {jobs.map((j) => {
            const overdue = j.dueDate && j.dueDate < today && j.status !== "done";
            return (
              <li key={j.id}>
                <Link href={`${base}/jobs/${j.id}`} className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={j.status} label={t.jobs.status[j.status]} />
                    {j.priority !== "normal" && <PriorityPill priority={j.priority} label={t.jobs.priority[j.priority]} />}
                    {overdue && <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">{t.jobs.overdue}</span>}
                    {me.role === "admin" && j.audience === "selected" && <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white"><EyeOff className="h-3 w-3" aria-hidden />{t.jobs.hiddenBadge}</span>}
                  </div>
                  <h2 className="mt-2 text-lg font-extrabold">{j.title}</h2>
                  {j.description && <p className="mt-1 line-clamp-2 text-sm text-ink-500">{j.description}</p>}
                  <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-ink-500">
                    {j.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{j.location}</span>}
                    {j.dueDate && <span className={`inline-flex items-center gap-1 ${overdue ? "text-red-600" : ""}`}><Calendar className="h-3.5 w-3.5" aria-hidden />{t.jobs.due}: {fmtDate(j.dueDate, locale)}</span>}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
