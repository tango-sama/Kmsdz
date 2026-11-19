import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, FileText, FolderOpen, Newspaper, Plus, Upload, UserCog, AlertTriangle, Pin } from "lucide-react";
import { getPortalDict, fmtDate } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { requireActor } from "@/lib/auth/server";
import { listJobs } from "@/lib/portal/jobs";
import { listFiles } from "@/lib/portal/files";
import { listPosts } from "@/lib/portal/news";
import { Empty, PriorityPill, StatusPill } from "@/components/portal/bits";

export default async function Dashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const me = await requireActor(locale);
  const t = getPortalDict(locale);
  const base = `/${locale}/portal`;
  const [jobs, files, posts] = await Promise.all([listJobs(me), listFiles(me, { limit: 200 }), listPosts(30)]);
  const active = jobs.filter((j) => j.status !== "done");
  const urgent = active.filter((j) => j.priority === "urgent").length;

  const stats = [
    { label: t.dashboard.activeJobs, value: active.length, icon: Briefcase, href: `${base}/jobs` },
    { label: t.dashboard.urgentJobs, value: urgent, icon: AlertTriangle, href: `${base}/jobs`, hot: urgent > 0 },
    { label: t.dashboard.filesCount, value: files.length, icon: FolderOpen, href: `${base}/files` },
  ];

  return (
    <>
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t.dashboard.hello}{locale === "ar" ? "،" : ","} {me.fullName}</h1>
      <p className="mt-1 text-ink-500">{t.dashboard.lead}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className={`grid h-12 w-12 place-items-center rounded-xl text-white ${s.hot ? "bg-red-600" : "bg-brand"}`}><s.icon className="h-6 w-6" aria-hidden /></span>
            <span><span className="block text-3xl font-extrabold leading-none"><span className="ltr-isolate">{s.value}</span></span><span className="mt-1 block text-sm font-semibold text-ink-500">{s.label}</span></span>
          </Link>
        ))}
      </div>

      {me.role === "admin" && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`${base}/jobs/new`} className="btn btn-primary"><Plus className="h-4 w-4" aria-hidden />{t.dashboard.newJob}</Link>
          <Link href={`${base}/files`} className="btn btn-outline"><Upload className="h-4 w-4" aria-hidden />{t.dashboard.uploadFile}</Link>
          <Link href={`${base}/users`} className="btn btn-outline"><UserCog className="h-4 w-4" aria-hidden />{t.dashboard.manageUsers}</Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="h-jobs">
          <div className="mb-3 flex items-center justify-between"><h2 id="h-jobs" className="text-lg font-extrabold">{t.dashboard.latestJobs}</h2><Link href={`${base}/jobs`} className="text-sm font-bold text-brand hover:underline">{t.common.viewAll}</Link></div>
          {active.length === 0 ? <Empty>{t.dashboard.emptyJobs}</Empty> : (
            <ul className="space-y-3">
              {active.slice(0, 5).map((j) => (
                <li key={j.id}>
                  <Link href={`${base}/jobs/${j.id}`} className="card block p-4 transition hover:shadow-lift">
                    <div className="flex flex-wrap items-center gap-2"><StatusPill status={j.status} label={t.jobs.status[j.status]} />{j.priority !== "normal" && <PriorityPill priority={j.priority} label={t.jobs.priority[j.priority]} />}</div>
                    <p className="mt-2 font-extrabold">{j.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{[j.location, j.dueDate ? `${t.jobs.due}: ${fmtDate(j.dueDate, locale)}` : ""].filter(Boolean).join(" · ")}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="h-files">
          <div className="mb-3 flex items-center justify-between"><h2 id="h-files" className="text-lg font-extrabold">{t.dashboard.latestFiles}</h2><Link href={`${base}/files`} className="text-sm font-bold text-brand hover:underline">{t.common.viewAll}</Link></div>
          {files.length === 0 ? <Empty>{t.dashboard.emptyFiles}</Empty> : (
            <ul className="space-y-3">
              {files.slice(0, 5).map((f) => (
                <li key={f.id}>
                  <a href={`/api/portal/files/${f.id}`} target="_blank" rel="noopener" className="card flex items-center gap-3 p-4 transition hover:shadow-lift">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><FileText className="h-5 w-5" aria-hidden /></span>
                    <span className="min-w-0"><span className="block truncate font-extrabold">{f.title}</span><span className="block text-xs text-ink-500">{t.files.categories[f.category as keyof typeof t.files.categories] ?? f.category} · {fmtDate(f.createdAt, locale)}</span></span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8" aria-labelledby="h-news">
        <div className="mb-3 flex items-center justify-between"><h2 id="h-news" className="text-lg font-extrabold">{t.dashboard.latestNews}</h2><Link href={`${base}/news`} className="text-sm font-bold text-brand hover:underline">{t.common.viewAll}</Link></div>
        {posts.length === 0 ? <Empty>{t.dashboard.emptyNews}</Empty> : (
          <ul className="space-y-3">
            {posts.slice(0, 3).map((p) => (
              <li key={p.id} className="card p-4">
                <div className="flex items-center gap-2 text-xs text-ink-500">{p.pinned && <Pin className="h-3.5 w-3.5 text-brand" aria-hidden />}<Newspaper className="h-3.5 w-3.5" aria-hidden /><span className="font-bold">{p.authorName}</span> · {fmtDate(p.createdAt, locale, true)}</div>
                {p.title && <p className="mt-1 font-extrabold">{p.title}</p>}
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-ink-600">{p.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
