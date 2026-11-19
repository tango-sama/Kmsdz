"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLocale, type Locale } from "@/i18n/config";
import { login } from "@/lib/auth/login";
import { deleteSession } from "@/lib/auth/session";
import { clearSessionCookie, clientIp, getSessionToken, requireActor, requireAdmin, setSessionCookie } from "@/lib/auth/server";
import { isDbConfigured } from "@/lib/db";
import { PortalError } from "@/lib/portal/types";
import type { ActionState } from "@/lib/portal/action-types";
import * as users from "@/lib/portal/users";
import * as jobs from "@/lib/portal/jobs";
import * as files from "@/lib/portal/files";
import * as news from "@/lib/portal/news";

const str = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");
const localeOf = (fd: FormData): Locale => (isLocale(str(fd, "locale")) ? (str(fd, "locale") as Locale) : "ar");
const refresh = (locale: Locale) => revalidatePath(`/${locale}/portal`, "layout");

function fail(e: unknown): ActionState {
  if (e instanceof PortalError) return { error: e.code, nonce: Date.now() };
  console.error("[portal] action failed:", e instanceof Error ? e.message : "unknown");
  return { error: "UNKNOWN", nonce: Date.now() };
}
const done = (extra: Partial<NonNullable<ActionState>> = {}): ActionState => ({ ok: true, nonce: Date.now(), ...extra });

const audienceOf = (fd: FormData) => ({ audience: str(fd, "audience") === "selected" ? ("selected" as const) : ("all" as const), userIds: fd.getAll("userIds").filter((v): v is string => typeof v === "string") });

/* ---------------- authentication ---------------- */

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  let mustChange = false;
  try {
    if (!isDbConfigured()) throw new PortalError("NOT_CONFIGURED");
    const r = await login(str(fd, "username"), str(fd, "password"), await clientIp());
    await setSessionCookie(r.token, r.expires);
    mustChange = r.actor.mustChangePassword;
  } catch (e) {
    if (e instanceof PortalError) return fail(e);
    console.error("[portal] login failed:", e instanceof Error ? e.message : "unknown");
    return { error: "NOT_CONFIGURED", nonce: Date.now() };
  }
  redirect(`/${locale}/portal${mustChange ? "/account" : ""}`);
}

export async function logoutAction(fd: FormData) {
  const locale = localeOf(fd);
  const token = await getSessionToken();
  if (token) await deleteSession(token).catch(() => {});
  await clearSessionCookie();
  redirect(`/${locale}/portal/login`);
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  let wasForced = false;
  try {
    const me = await requireActor(locale, { allowMustChange: true });
    wasForced = me.mustChangePassword;
    await users.changeOwnPassword(me, str(fd, "current"), str(fd, "next"), str(fd, "confirm"), await getSessionToken());
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  if (wasForced) redirect(`/${locale}/portal`);
  return done();
}

/* ---------------- users (admin) ---------------- */

export async function createUserAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    const me = await requireAdmin(locale);
    const r = await users.createUser(me, { username: str(fd, "username"), fullName: str(fd, "fullName"), role: str(fd, "role") });
    refresh(locale);
    return done({ temp: { username: str(fd, "username").trim().toLowerCase(), password: r.tempPassword } });
  } catch (e) {
    return fail(e);
  }
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    const me = await requireAdmin(locale);
    const password = await users.resetPassword(me, str(fd, "id"));
    refresh(locale);
    return done({ temp: { username: str(fd, "username"), password } });
  } catch (e) {
    return fail(e);
  }
}

export async function setActiveAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await users.setActive(await requireAdmin(locale), str(fd, "id"), str(fd, "active") === "true");
    refresh(locale);
    return done();
  } catch (e) {
    return fail(e);
  }
}

export async function deleteUserAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await users.deleteUser(await requireAdmin(locale), str(fd, "id"));
    refresh(locale);
    return done();
  } catch (e) {
    return fail(e);
  }
}

/* ---------------- jobs (admin) ---------------- */

const jobInput = (fd: FormData): jobs.JobInput => ({
  title: str(fd, "title"), description: str(fd, "description"), location: str(fd, "location"), client: str(fd, "client"),
  status: (str(fd, "status") || "new") as jobs.JobInput["status"], priority: (str(fd, "priority") || "normal") as jobs.JobInput["priority"], startDate: str(fd, "startDate"), dueDate: str(fd, "dueDate"),
  ...audienceOf(fd),
});

export async function createJobAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  let id = "";
  try {
    id = await jobs.createJob(await requireAdmin(locale), jobInput(fd));
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  redirect(`/${locale}/portal/jobs/${id}`);
}

export async function updateJobAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await jobs.updateJob(await requireAdmin(locale), str(fd, "id"), jobInput(fd));
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  return done();
}

export async function jobStatusAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await jobs.setJobStatus(await requireAdmin(locale), str(fd, "id"), str(fd, "status"));
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  return done();
}

export async function deleteJobAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await jobs.deleteJob(await requireAdmin(locale), str(fd, "id"));
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  redirect(`/${locale}/portal/jobs`);
}

/* ---------------- files (admin) ---------------- */

const fileInput = (fd: FormData): files.FileInput => ({
  title: str(fd, "title"), description: str(fd, "description"), category: (str(fd, "category") || "other") as files.FileInput["category"], jobId: str(fd, "jobId"), ...audienceOf(fd),
});

export async function uploadFileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    const me = await requireAdmin(locale);
    const f = fd.get("file");
    if (!(f instanceof File) || f.size === 0) throw new PortalError("FILE_REQUIRED");
    if (f.size > 4 * 1024 * 1024) throw new PortalError("FILE_SIZE");
    const input = fileInput(fd);
    if (!input.title.trim()) input.title = f.name.replace(/\.[^.]+$/, "");
    await files.createFile(me, input, { name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) });
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  return done();
}

export async function updateFileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await files.updateFile(await requireAdmin(locale), str(fd, "id"), fileInput(fd));
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  return done();
}

export async function deleteFileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await files.deleteFile(await requireAdmin(locale), str(fd, "id"));
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  return done();
}

/* ---------------- news (all signed-in users) ---------------- */

export async function createPostAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await news.createPost(await requireActor(locale), { title: str(fd, "title"), body: str(fd, "body") });
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  return done();
}

export async function addCommentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await news.addComment(await requireActor(locale), str(fd, "postId"), str(fd, "body"));
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  return done();
}

export async function deletePostAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await news.deletePost(await requireActor(locale), str(fd, "id"));
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  return done();
}

export async function deleteCommentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await news.deleteComment(await requireActor(locale), str(fd, "id"));
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  return done();
}

export async function pinPostAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const locale = localeOf(fd);
  try {
    await news.setPinned(await requireAdmin(locale), str(fd, "id"), str(fd, "pinned") === "true");
  } catch (e) {
    return fail(e);
  }
  refresh(locale);
  return done();
}
