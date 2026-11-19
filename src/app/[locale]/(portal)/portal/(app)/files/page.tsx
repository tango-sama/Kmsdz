import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Download, EyeOff, FileText, Image as ImageIcon, FileSpreadsheet, Printer, Search, Upload } from "lucide-react";
import { getPortalDict, fmtDate, fmtSize } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { requireActor } from "@/lib/auth/server";
import { listFiles, getFileAudience, type FileItem } from "@/lib/portal/files";
import { listJobOptions } from "@/lib/portal/jobs";
import { listWorkers } from "@/lib/portal/users";
import { FILE_ACCEPT } from "@/lib/portal/filetypes";
import { FILE_CATEGORIES } from "@/lib/portal/types";
import { ActionForm } from "@/components/portal/action-form";
import { AudiencePicker } from "@/components/portal/audience-picker";
import { Empty, PageTitle } from "@/components/portal/bits";
import { deleteFileAction, updateFileAction, uploadFileAction } from "../../actions";
import type { PortalDict } from "@/i18n/portal";

function FileFields({ t, f, jobs }: { t: PortalDict; f?: FileItem; jobs: { id: string; title: string }[] }) {
  const x = t.files.fields;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><label className="label">{x.title}</label><input name="title" maxLength={120} defaultValue={f?.title} className="field" /></div>
      <div className="sm:col-span-2"><label className="label">{x.description}</label><input name="description" maxLength={500} defaultValue={f?.description} className="field" /></div>
      <div><label className="label">{x.category}</label>
        <select name="category" defaultValue={f?.category ?? "forms"} className="field">{FILE_CATEGORIES.map((c) => <option key={c} value={c}>{t.files.categories[c]}</option>)}</select></div>
      <div><label className="label">{x.job}</label>
        <select name="jobId" defaultValue={f?.jobId ?? ""} className="field"><option value="">{t.files.noJob}</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select></div>
    </div>
  );
}

export default async function FilesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string; category?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { q, category } = await searchParams;
  const me = await requireActor(locale);
  const t = getPortalDict(locale);
  const isAdmin = me.role === "admin";
  const files = await listFiles(me, { q, category });
  const [workers, jobs, grants] = isAdmin
    ? await Promise.all([listWorkers(me), listJobOptions(me), Promise.all(files.map((f) => getFileAudience(me, f.id)))])
    : [[], [], []];
  const icon = (f: FileItem) => (f.mime.startsWith("image/") ? ImageIcon : f.mime.includes("sheet") || f.mime.includes("excel") || f.mime.includes("csv") ? FileSpreadsheet : FileText);

  return (
    <>
      <PageTitle title={t.files.title} lead={t.files.lead} />

      <form method="get" className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input type="search" name="q" defaultValue={q} placeholder={t.files.searchPlaceholder} aria-label={t.common.search} className="field !ps-10" />
        </div>
        <select name="category" defaultValue={category ?? ""} aria-label={t.files.fields.category} className="field !w-auto">
          <option value="">{t.files.allCategories}</option>
          {FILE_CATEGORIES.map((c) => <option key={c} value={c}>{t.files.categories[c]}</option>)}
        </select>
        <button className="btn btn-dark">{t.common.filter}</button>
      </form>

      {isAdmin && (
        <details className="card mb-6 p-5" open={files.length === 0}>
          <summary className="flex cursor-pointer items-center gap-2 font-extrabold"><Upload className="h-5 w-5 text-brand" aria-hidden />{t.files.upload}</summary>
          <ActionForm action={uploadFileAction} encType="multipart/form-data" className="mt-5 space-y-5" submitLabel={t.common.add} successMessage={t.common.created} resetOnSuccess>
            <FileFields t={t} jobs={jobs} />
            <div>
              <label className="label" htmlFor="file">{t.files.fields.file}</label>
              <input id="file" name="file" type="file" required accept={FILE_ACCEPT} className="field !p-2.5" />
              <p className="mt-1.5 text-xs text-ink-500">{t.files.limits}</p>
            </div>
            <AudiencePicker workers={workers} />
          </ActionForm>
        </details>
      )}

      {files.length === 0 ? <Empty>{t.files.empty}</Empty> : (
        <>
          <p className="mb-3 flex items-center gap-2 text-xs text-ink-500"><Printer className="h-3.5 w-3.5" aria-hidden />{t.files.openHint}</p>
          <ul className="space-y-3">
            {files.map((f, i) => {
              const Icon = icon(f);
              return (
                <li key={f.id} className="card p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><Icon className="h-6 w-6" aria-hidden /></span>
                    <div className="min-w-0 flex-1 basis-56">
                      <h2 className="font-extrabold">{f.title}</h2>
                      {f.description && <p className="text-sm text-ink-500">{f.description}</p>}
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-ink-400">
                        <span className="rounded-full bg-mist px-2 py-0.5 text-ink-600">{t.files.categories[f.category as keyof typeof t.files.categories] ?? f.category}</span>
                        <span className="ltr-isolate">{fmtSize(f.size)}</span><span>{fmtDate(f.createdAt, locale)}</span>
                        {f.jobTitle && <Link href={`/${locale}/portal/jobs/${f.jobId}`} className="inline-flex items-center gap-1 hover:text-brand"><Briefcase className="h-3 w-3" aria-hidden />{f.jobTitle}</Link>}
                        {isAdmin && f.audience === "selected" && <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-white"><EyeOff className="h-3 w-3" aria-hidden />{t.jobs.hiddenBadge}</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a href={`/api/portal/files/${f.id}`} target="_blank" rel="noopener" className="btn btn-primary !px-4 !py-2.5 !text-sm">{f.inline ? <Printer className="h-4 w-4" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}{f.inline ? t.files.open : t.files.download}</a>
                      {f.inline && <a href={`/api/portal/files/${f.id}?download=1`} aria-label={`${t.files.download}: ${f.title}`} className="btn btn-outline !px-3 !py-2.5"><Download className="h-4 w-4" aria-hidden /></a>}
                    </div>
                  </div>
                  {isAdmin && (
                    <details className="mt-4 border-t border-ink/10 pt-3">
                      <summary className="cursor-pointer text-sm font-bold text-ink-600">{t.files.adminEdit}</summary>
                      <ActionForm action={updateFileAction} className="mt-4 space-y-4" submitLabel={t.common.save} successMessage={t.common.saved}>
                        <input type="hidden" name="id" value={f.id} />
                        <FileFields t={t} f={f} jobs={jobs} />
                        <AudiencePicker workers={workers} defaultAudience={f.audience} defaultIds={grants[i] ?? []} />
                      </ActionForm>
                      <ActionForm action={deleteFileAction} className="mt-4" submitLabel={t.common.delete} submitClassName="btn !bg-red-600 !py-2 !text-sm text-white hover:!bg-red-700" confirm={t.common.confirmDelete}>
                        <input type="hidden" name="id" value={f.id} />
                      </ActionForm>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
