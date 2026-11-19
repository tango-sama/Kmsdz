import { notFound } from "next/navigation";
import { MessageSquare, Pin, PinOff, Trash2 } from "lucide-react";
import { getPortalDict, fmtDate } from "@/i18n/portal";
import { isLocale } from "@/i18n/config";
import { requireActor } from "@/lib/auth/server";
import { listPosts } from "@/lib/portal/news";
import { ActionForm } from "@/components/portal/action-form";
import { Empty, PageTitle } from "@/components/portal/bits";
import { addCommentAction, createPostAction, deleteCommentAction, deletePostAction, pinPostAction } from "../../actions";

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const me = await requireActor(locale);
  const t = getPortalDict(locale);
  const posts = await listPosts(50);
  const isAdmin = me.role === "admin";

  return (
    <>
      <PageTitle title={t.news.title} lead={t.news.lead} />

      <ActionForm action={createPostAction} className="card mb-8 space-y-3 p-5" submitLabel={t.news.publish} successMessage={t.common.created} resetOnSuccess>
        <h2 className="font-extrabold">{t.news.write}</h2>
        <input name="title" maxLength={120} placeholder={t.news.titleField} aria-label={t.news.titleField} className="field" />
        <textarea name="body" required minLength={2} maxLength={4000} rows={3} placeholder={t.news.bodyField} aria-label={t.news.bodyField} className="field resize-y" />
      </ActionForm>

      {posts.length === 0 ? <Empty>{t.news.empty}</Empty> : (
        <ul className="space-y-5">
          {posts.map((p) => (
            <li key={p.id} className={`card p-5 ${p.pinned ? "ring-2 ring-brand/40" : ""}`}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm font-extrabold text-white">{p.authorName.trim().charAt(0).toUpperCase()}</span>
                <span className="font-extrabold">{p.authorName}</span>
                {p.authorRole === "admin" && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{t.news.adminTag}</span>}
                <span className="text-xs text-ink-400">{fmtDate(p.createdAt, locale, true)}</span>
                {p.pinned && <span className="inline-flex items-center gap-1 text-xs font-bold text-brand"><Pin className="h-3.5 w-3.5" aria-hidden />{t.news.pinned}</span>}
                <span className="ms-auto flex gap-1">
                  {isAdmin && (
                    <ActionForm action={pinPostAction} hideSubmit inline>
                      <input type="hidden" name="id" value={p.id} /><input type="hidden" name="pinned" value={String(!p.pinned)} />
                      <button className="btn btn-outline !px-2.5 !py-1.5 !text-xs" aria-label={p.pinned ? t.news.unpin : t.news.pin}>{p.pinned ? <PinOff className="h-3.5 w-3.5" aria-hidden /> : <Pin className="h-3.5 w-3.5" aria-hidden />}</button>
                    </ActionForm>
                  )}
                  {(isAdmin || p.authorId === me.id) && (
                    <ActionForm action={deletePostAction} hideSubmit inline confirm={t.common.confirmDelete}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn btn-outline !px-2.5 !py-1.5 !text-xs hover:!border-red-500 hover:!text-red-600" aria-label={t.news.deletePost}><Trash2 className="h-3.5 w-3.5" aria-hidden /></button>
                    </ActionForm>
                  )}
                </span>
              </div>
              {p.title && <h2 className="mt-3 text-lg font-extrabold">{p.title}</h2>}
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink-700">{p.body}</p>

              <div className="mt-4 border-t border-ink/10 pt-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink-500"><MessageSquare className="h-3.5 w-3.5" aria-hidden />{t.news.comments} (<span className="ltr-isolate">{p.comments.length}</span>)</p>
                {p.comments.length > 0 && (
                  <ul className="mb-3 space-y-2">
                    {p.comments.map((c) => (
                      <li key={c.id} className="flex items-start gap-2 rounded-xl bg-mist px-3 py-2 text-sm">
                        <div className="min-w-0 flex-1"><span className="font-extrabold">{c.authorName}</span> <span className="text-xs text-ink-400">{fmtDate(c.createdAt, locale, true)}</span><p className="whitespace-pre-wrap break-words">{c.body}</p></div>
                        {(isAdmin || c.authorId === me.id) && (
                          <ActionForm action={deleteCommentAction} hideSubmit inline confirm={t.common.confirmDelete}>
                            <input type="hidden" name="id" value={c.id} />
                            <button className="text-ink-400 hover:text-red-600" aria-label={t.news.deleteComment}><Trash2 className="h-4 w-4" aria-hidden /></button>
                          </ActionForm>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <ActionForm action={addCommentAction} className="flex gap-2" submitLabel={t.news.reply} submitClassName="btn btn-dark !px-4 !py-2.5 !text-sm" resetOnSuccess inline>
                  <input type="hidden" name="postId" value={p.id} />
                  <input name="body" required maxLength={1000} placeholder={t.news.commentPlaceholder} aria-label={t.news.commentPlaceholder} className="field !py-2.5" />
                </ActionForm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
