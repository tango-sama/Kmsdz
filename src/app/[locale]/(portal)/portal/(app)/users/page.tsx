import { notFound } from "next/navigation";
import { KeyRound, Trash2, UserCheck, UserPlus, UserX } from "lucide-react";
import { getPortalDict, fmtDate } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { requireAdmin } from "@/lib/auth/server";
import { listUsers } from "@/lib/portal/users";
import { ActionForm } from "@/components/portal/action-form";
import { PageTitle, Pill } from "@/components/portal/bits";
import { createUserAction, deleteUserAction, resetPasswordAction, setActiveAction } from "../../actions";

export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const me = await requireAdmin(locale);
  const t = getPortalDict(locale);
  const users = await listUsers(me);
  const u = t.users;
  const staff = users.filter((x) => x.role !== "customer");
  const customers = users.filter((x) => x.role === "customer");
  const renderUser = (x: (typeof users)[number]) => {
          const self = x.id === me.id;
          return (
            <li key={x.id} className={`card p-5 ${x.active ? "" : "opacity-70"}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-ink font-extrabold text-white">{x.fullName.trim().charAt(0).toUpperCase()}</span>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-extrabold">{x.fullName} {self && <span className="text-xs font-bold text-brand">({u.you})</span>}</p>
                  <p className="text-xs text-ink-500"><span className="ltr-isolate">@{x.username}</span> · {u.lastLogin}: {x.lastLoginAt ? fmtDate(x.lastLoginAt, locale, true) : u.never}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Pill tone={x.role === "admin" ? "bg-ink text-white ring-ink" : "bg-mist text-ink-600 ring-ink/10"}>{t.roles[x.role]}</Pill>
                  <Pill tone={x.active ? "bg-green-50 text-green-700 ring-green-200" : "bg-red-50 text-red-700 ring-red-200"}>{x.active ? u.active : u.disabled}</Pill>
                  {x.mustChangePassword && <Pill tone="bg-amber-50 text-amber-800 ring-amber-200">{u.mustChange}</Pill>}
                </div>
              </div>
              {!self && (
                <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-ink/10 pt-3">
                  <ActionForm action={resetPasswordAction} className="max-w-full" submitLabel={<><KeyRound className="h-4 w-4" aria-hidden />{u.reset}</>} submitClassName="btn btn-outline !py-2 !text-sm" confirm={u.confirmReset}>
                    <input type="hidden" name="id" value={x.id} /><input type="hidden" name="username" value={x.username} />
                  </ActionForm>
                  <ActionForm action={setActiveAction} submitLabel={<>{x.active ? <UserX className="h-4 w-4" aria-hidden /> : <UserCheck className="h-4 w-4" aria-hidden />}{x.active ? u.deactivate : u.activate}</>} submitClassName="btn btn-outline !py-2 !text-sm" inline>
                    <input type="hidden" name="id" value={x.id} /><input type="hidden" name="active" value={String(!x.active)} />
                  </ActionForm>
                  <ActionForm action={deleteUserAction} submitLabel={<><Trash2 className="h-4 w-4" aria-hidden />{t.common.delete}</>} submitClassName="btn btn-outline !py-2 !text-sm hover:!border-red-500 hover:!text-red-600" confirm={u.confirmDeleteUser} inline>
                    <input type="hidden" name="id" value={x.id} />
                  </ActionForm>
                </div>
              )}
            </li>
          );
  };

  return (
    <>
      <PageTitle title={u.title} lead={u.lead} />
      <ActionForm action={createUserAction} className="card mb-8 space-y-4 p-5" submitLabel={<><UserPlus className="h-4 w-4" aria-hidden />{u.add}</>} resetOnSuccess>
        <h2 className="font-extrabold">{u.add}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label" htmlFor="fullName">{u.fields.fullName}</label><input id="fullName" name="fullName" required minLength={2} maxLength={80} className="field" /></div>
          <div><label className="label" htmlFor="username">{u.fields.username}</label><input id="username" name="username" required pattern="[a-zA-Z0-9._\-]{3,32}" maxLength={32} dir="ltr" autoCapitalize="none" className="field text-start" /></div>
          <div><label className="label" htmlFor="role">{u.fields.role}</label>
            <select id="role" name="role" defaultValue="worker" className="field"><option value="worker">{t.roles.worker}</option><option value="admin">{t.roles.admin}</option></select></div>
        </div>
        <p className="text-xs text-ink-500">{u.usernameHint}</p>
      </ActionForm>

      <ul className="space-y-3">{staff.map(renderUser)}</ul>

      <h2 className="mb-1 mt-10 text-xl font-extrabold">{u.customersTitle} <span className="text-base font-bold text-ink-500">({customers.length})</span></h2>
      <p className="mb-4 text-sm text-ink-500">{u.customersLead}</p>
      <ul className="space-y-3">
        {customers.length === 0 ? <li className="card p-5 text-sm text-ink-500">{u.noCustomers}</li> : customers.map(renderUser)}
      </ul>
    </>
  );
}
