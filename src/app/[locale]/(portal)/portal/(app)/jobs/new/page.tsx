import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPortalDict } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { requireAdmin } from "@/lib/auth/server";
import { listWorkers } from "@/lib/portal/users";
import { ActionForm } from "@/components/portal/action-form";
import { JobFields } from "@/components/portal/job-fields";
import { PageTitle } from "@/components/portal/bits";
import { createJobAction } from "../../../actions";

export default async function NewJob({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const me = await requireAdmin(locale);
  const t = getPortalDict(locale);
  const workers = await listWorkers(me);
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;
  return (
    <>
      <Link href={`/${locale}/portal/jobs`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand"><Back className="h-4 w-4" aria-hidden />{t.common.back}</Link>
      <PageTitle title={t.jobs.newTitle} />
      <ActionForm action={createJobAction} className="card space-y-6 p-6" submitLabel={t.common.add}>
        <JobFields t={t} workers={workers} />
      </ActionForm>
    </>
  );
}
