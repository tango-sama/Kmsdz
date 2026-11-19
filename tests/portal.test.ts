import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { useTestDb, getDb } from "../src/lib/db/index.ts";
import { login, ensureBootstrapAdmin } from "../src/lib/auth/login.ts";
import { getActorByToken, deleteSession } from "../src/lib/auth/session.ts";
import { hashPassword, verifyPassword, passwordProblem, generatePassword } from "../src/lib/auth/password.ts";
import { changeOwnPassword, createUser, deleteUser, listUsers, resetPassword, setActive } from "../src/lib/portal/users.ts";
import { createJob, deleteJob, getJob, listJobs, setJobStatus, updateJob } from "../src/lib/portal/jobs.ts";
import { createFile, deleteFile, getFileForDownload, getFileMeta, listFiles } from "../src/lib/portal/files.ts";
import { addComment, createPost, deleteComment, deletePost, listPosts, setPinned } from "../src/lib/portal/news.ts";
import { PortalError, type Actor } from "../src/lib/portal/types.ts";
import { checkFile } from "../src/lib/portal/filetypes.ts";

const rejects = (fn: () => Promise<unknown>, code: string) =>
  assert.rejects(fn, (e: unknown) => e instanceof PortalError && e.code === code, `expected ${code}`);

const PDF = new TextEncoder().encode("%PDF-1.4 plan de chantier");
let admin: Actor, ali: Actor, sara: Actor;
let aliPw = "", saraPw = "";

async function actorFor(username: string, password: string, ip = "1.1.1.1") {
  const r = await login(username, password, ip);
  return r;
}

before(async () => {
  process.env.ADMIN_USERNAME = "boss";
  process.env.ADMIN_PASSWORD = "Sup3rSecret!";
  await useTestDb();
  const r = await login("boss", "Sup3rSecret!", "9.9.9.9");
  admin = r.actor;
  const a = await createUser(admin, { username: "Ali", fullName: "Ali Benali", role: "worker" });
  const s = await createUser(admin, { username: "sara", fullName: "Sara Haddad", role: "worker" });
  aliPw = a.tempPassword; saraPw = s.tempPassword;
  ali = (await actorFor("ali", aliPw)).actor;
  sara = (await actorFor("sara", saraPw)).actor;
});

describe("passwords", () => {
  it("hashes with salt and verifies", async () => {
    const h = await hashPassword("abc12345!");
    assert.ok(h.startsWith("scrypt$"));
    assert.notEqual(h, await hashPassword("abc12345!"));
    assert.ok(await verifyPassword("abc12345!", h));
    assert.ok(!(await verifyPassword("abc12345?", h)));
    assert.ok(!(await verifyPassword("x", "garbage")));
  });
  it("policy and generator", () => {
    assert.equal(passwordProblem("short"), "WEAK_PASSWORD");
    assert.equal(passwordProblem("ali-ali-ali-123", "ali"), "WEAK_PASSWORD");
    assert.equal(passwordProblem("A-good-pass-2026"), null);
    assert.match(generatePassword(), /^[A-Za-z2-9]{12}$/);
  });
});

describe("authentication", () => {
  it("bootstrapped the first admin and normalises usernames", async () => {
    assert.equal(admin.role, "admin");
    assert.equal(ali.username, "ali");
    assert.ok(ali.mustChangePassword);
  });
  it("rejects wrong password / unknown user with the same error", async () => {
    await rejects(() => login("ali", "wrong-password", "2.2.2.2"), "INVALID_CREDENTIALS");
    await rejects(() => login("ghost", "whatever123", "2.2.2.2"), "INVALID_CREDENTIALS");
  });
  it("locks the account after 5 failures even with the right password, from any IP", async () => {
    await createUser(admin, { username: "lockme", fullName: "Lock Me", role: "worker" });
    for (let i = 0; i < 5; i++) await rejects(() => login("lockme", "nope-nope-" + i, "3.3.3." + i), "INVALID_CREDENTIALS");
    await rejects(() => login("lockme", "nope-nope-9", "3.3.3.99"), "LOCKED");
  });
  it("sessions: token resolves to the actor, logout invalidates it", async () => {
    const r = await login("boss", "Sup3rSecret!", "4.4.4.4");
    assert.equal((await getActorByToken(r.token))?.username, "boss");
    await deleteSession(r.token);
    assert.equal(await getActorByToken(r.token), null);
    assert.equal(await getActorByToken("not-a-real-token-not-a-real-token"), null);
  });
  it("stores only a hash of the session token", async () => {
    const r = await login("boss", "Sup3rSecret!", "4.4.4.5");
    const rows = await (await getDb()).query("select token_hash from sessions");
    assert.ok(rows.every((x) => x.token_hash !== r.token && x.token_hash.length === 64));
  });
  it("deactivating a worker kills their session and blocks login at once", async () => {
    const u = await createUser(admin, { username: "temp1", fullName: "Temp One", role: "worker" });
    const r = await login("temp1", u.tempPassword, "5.5.5.5");
    await setActive(admin, r.actor.id, false);
    assert.equal(await getActorByToken(r.token), null);
    await rejects(() => login("temp1", u.tempPassword, "5.5.5.5"), "INVALID_CREDENTIALS");
    await setActive(admin, r.actor.id, true);
    assert.ok((await login("temp1", u.tempPassword, "5.5.5.5")).token);
  });
  it("changing password: needs current, policy, signs out other devices, clears must-change", async () => {
    const u = await createUser(admin, { username: "pwuser", fullName: "Pw User", role: "worker" });
    const s1 = await login("pwuser", u.tempPassword, "6.6.6.6");
    const s2 = await login("pwuser", u.tempPassword, "6.6.6.7");
    await rejects(() => changeOwnPassword(s1.actor, "bad", "NewStrongPass9", "NewStrongPass9"), "WRONG_PASSWORD");
    await rejects(() => changeOwnPassword(s1.actor, u.tempPassword, "short", "short"), "WEAK_PASSWORD");
    await rejects(() => changeOwnPassword(s1.actor, u.tempPassword, "NewStrongPass9", "Different1234"), "PASSWORD_MISMATCH");
    await changeOwnPassword(s1.actor, u.tempPassword, "NewStrongPass9", "NewStrongPass9", s1.token);
    assert.ok(await getActorByToken(s1.token));
    assert.equal(await getActorByToken(s2.token), null);
    const again = await login("pwuser", "NewStrongPass9", "6.6.6.8");
    assert.equal(again.actor.mustChangePassword, false);
  });
});

describe("user administration", () => {
  it("workers cannot administer anything", async () => {
    await rejects(() => createUser(ali, { username: "x1x", fullName: "X", role: "worker" }), "FORBIDDEN");
    await rejects(() => listUsers(ali), "FORBIDDEN");
    await rejects(() => resetPassword(ali, sara.id), "FORBIDDEN");
    await rejects(() => setActive(ali, sara.id, false), "FORBIDDEN");
    await rejects(() => deleteUser(ali, sara.id), "FORBIDDEN");
    await rejects(() => createJob(ali, { title: "Hack job" }), "FORBIDDEN");
    await rejects(() => createFile(ali, { title: "Hack file" }, { name: "a.pdf", bytes: PDF }), "FORBIDDEN");
  });
  it("rejects duplicate / invalid usernames", async () => {
    await rejects(() => createUser(admin, { username: "ALI", fullName: "Dup", role: "worker" }), "USERNAME_TAKEN");
    await rejects(() => createUser(admin, { username: "a b", fullName: "Bad", role: "worker" }), "VALIDATION");
    await rejects(() => createUser(admin, { username: "okname", fullName: "Bad", role: "superuser" }), "VALIDATION");
  });
  it("protects the last admin and self-lockout", async () => {
    await rejects(() => setActive(admin, admin.id, false), "SELF");
    await rejects(() => deleteUser(admin, admin.id), "SELF");
    const second = await createUser(admin, { username: "admin2", fullName: "Second Admin", role: "admin" });
    await setActive(admin, second.id, false);
    const sec = (await login("admin2", second.tempPassword, "7.7.7.7").catch(() => null));
    assert.equal(sec, null);
    await setActive(admin, second.id, true);
    const secActor = (await login("admin2", second.tempPassword, "7.7.7.7")).actor;
    await setActive(secActor, admin.id, false); // allowed: another admin remains
    await rejects(() => setActive(secActor, secActor.id, false), "SELF");
    await setActive(secActor, admin.id, true);
  });
  it("reset password issues a new temp password and signs the user out", async () => {
    const u = await createUser(admin, { username: "resetme", fullName: "Reset Me", role: "worker" });
    const s = await login("resetme", u.tempPassword, "8.8.8.8");
    const np = await resetPassword(admin, s.actor.id);
    assert.equal(await getActorByToken(s.token), null);
    await rejects(() => login("resetme", u.tempPassword, "8.8.8.8"), "INVALID_CREDENTIALS");
    assert.ok((await login("resetme", np, "8.8.8.8")).actor.mustChangePassword);
  });
});

describe("jobs and visibility", () => {
  let publicJob = "", secretJob = "", aliOnlyJob = "";
  before(async () => {
    publicJob = await createJob(admin, { title: "Étanchéité villa Touggourt", audience: "all", dueDate: "2027-01-15", priority: "urgent" });
    secretJob = await createJob(admin, { title: "Job confidentiel direction", audience: "selected", userIds: [] });
    aliOnlyJob = await createJob(admin, { title: "Chantier solaire - équipe Ali", audience: "selected", userIds: [ali.id, "not-a-uuid"] });
  });
  it("admin sees all, each worker sees only what they are allowed", async () => {
    assert.equal((await listJobs(admin)).length, 3);
    assert.deepEqual((await listJobs(ali)).map((j) => j.id).sort(), [publicJob, aliOnlyJob].sort());
    assert.deepEqual((await listJobs(sara)).map((j) => j.id), [publicJob]);
  });
  it("a hidden job is indistinguishable from a missing one", async () => {
    assert.equal(await getJob(sara, secretJob), null);
    assert.equal(await getJob(sara, aliOnlyJob), null);
    assert.equal(await getJob(ali, secretJob), null);
    assert.ok(await getJob(ali, aliOnlyJob));
    assert.equal(await getJob(sara, "../../etc/passwd"), null);
  });
  it("admin can change who sees a job, and its status", async () => {
    await updateJob(admin, aliOnlyJob, { title: "Chantier solaire - équipe Ali", audience: "selected", userIds: [sara.id] });
    assert.equal(await getJob(ali, aliOnlyJob), null);
    assert.ok(await getJob(sara, aliOnlyJob));
    await updateJob(admin, aliOnlyJob, { title: "Chantier solaire", audience: "all" });
    assert.ok(await getJob(ali, aliOnlyJob));
    await setJobStatus(admin, aliOnlyJob, "done");
    assert.equal((await listJobs(ali, { status: "done" })).length, 1);
    await rejects(() => setJobStatus(admin, aliOnlyJob, "weird"), "VALIDATION");
  });
  it("validates input and orders urgent first, done last", async () => {
    await rejects(() => createJob(admin, { title: "x" }), "VALIDATION");
    await rejects(() => createJob(admin, { title: "Valid title", dueDate: "31/12/2026" }), "VALIDATION");
    const list = await listJobs(sara);
    assert.equal(list[0].id, publicJob);
    assert.equal(list[list.length - 1].status, "done");
  });
  it("SQL injection attempts are inert", async () => {
    const id = await createJob(admin, { title: "'); drop table jobs; --", description: "Robert'); DROP TABLE users;--" });
    assert.ok(await getJob(admin, id));
    assert.ok((await listJobs(admin, { status: "new'; drop table jobs;--" })).length >= 1);
    assert.ok((await listFiles(admin, { q: "%' or 1=1 --" })).length === 0);
    await deleteJob(admin, id);
  });
  it("deleting a job removes it", async () => {
    await deleteJob(admin, secretJob);
    assert.equal((await listJobs(admin)).some((j) => j.id === secretJob), false);
  });
});

describe("files, printing access and hiding", () => {
  let open = "", hidden = "", forAli = "";
  before(async () => {
    open = await createFile(admin, { title: "Fiche de sécurité chantier", category: "safety" }, { name: "securite.pdf", bytes: PDF });
    hidden = await createFile(admin, { title: "Plan confidentiel", category: "plans", audience: "selected", userIds: [] }, { name: "plan.pdf", bytes: PDF });
    forAli = await createFile(admin, { title: "Bon de travail Ali", category: "forms", audience: "selected", userIds: [ali.id] }, { name: "bon.pdf", bytes: PDF });
  });
  it("lists only permitted files and never returns file content in listings", async () => {
    assert.equal((await listFiles(admin)).length, 3);
    assert.deepEqual((await listFiles(sara)).map((f) => f.id), [open]);
    assert.deepEqual((await listFiles(ali)).map((f) => f.id).sort(), [open, forAli].sort());
    assert.ok(!("data" in (await listFiles(admin))[0]));
  });
  it("download is authorised in the query: hidden file => null for others, bytes intact for allowed", async () => {
    assert.equal(await getFileForDownload(sara, hidden), null);
    assert.equal(await getFileForDownload(sara, forAli), null);
    assert.equal(await getFileMeta(sara, hidden), null);
    const f = await getFileForDownload(ali, forAli);
    assert.ok(f && f.inline && f.mime === "application/pdf");
    assert.deepEqual(new Uint8Array(f!.data), PDF);
    assert.ok(await getFileForDownload(admin, hidden));
  });
  it("search and category filters work", async () => {
    assert.equal((await listFiles(admin, { q: "sécurité" })).length, 1);
    assert.equal((await listFiles(admin, { category: "plans" })).length, 1);
  });
  it("does not leak the title of a hidden job linked to a visible file", async () => {
    const j = await createJob(admin, { title: "Projet secret XYZ", audience: "selected", userIds: [] });
    const f = await createFile(admin, { title: "Notice liée", jobId: j }, { name: "n.pdf", bytes: PDF });
    assert.equal((await listFiles(sara)).find((x) => x.id === f)?.jobTitle, null);
    assert.equal((await listFiles(admin)).find((x) => x.id === f)?.jobTitle, "Projet secret XYZ");
  });
  it("verifies real content: fake PDFs, executables, oversize and empty files are refused", async () => {
    await rejects(() => createFile(admin, { title: "Fake pdf" }, { name: "a.pdf", bytes: new Uint8Array([1, 2, 3, 4]) }), "FILE_TYPE");
    await rejects(() => createFile(admin, { title: "Malware" }, { name: "a.exe", bytes: new Uint8Array([0x4d, 0x5a, 0, 0]) }), "FILE_TYPE");
    await rejects(() => createFile(admin, { title: "Script" }, { name: "a.html", bytes: new TextEncoder().encode("<script>alert(1)</script>") }), "FILE_TYPE");
    await rejects(() => createFile(admin, { title: "Big" }, { name: "a.pdf", bytes: new Uint8Array(4 * 1024 * 1024 + 1).fill(0x25) }), "FILE_SIZE");
    await rejects(() => createFile(admin, { title: "Empty" }, { name: "a.pdf", bytes: new Uint8Array() }), "FILE_REQUIRED");
    assert.equal(checkFile("x.csv", new TextEncoder().encode("a,b\n1,2")).ok, true);
    const docx = checkFile("x.docx", new Uint8Array([0x50, 0x4b, 3, 4]));
    assert.ok(docx.ok && !docx.inline); // office docs are download-only
  });
  it("deleting a file removes it", async () => {
    await deleteFile(admin, hidden);
    assert.equal(await getFileForDownload(admin, hidden), null);
  });
});

describe("news exchange", () => {
  it("workers post and comment; everyone sees the feed; pinning is admin-only", async () => {
    const p = await createPost(ali, { title: "Livraison matériaux", body: "Le camion arrive demain à 8h au chantier." });
    await addComment(sara, p, "Bien reçu, je prépare la zone de stockage.");
    await addComment(admin, p, "Merci à tous.");
    const feed = await listPosts();
    assert.equal(feed[0].comments.length, 2);
    assert.equal(feed[0].authorName, "Ali Benali");
    await rejects(() => setPinned(sara, p, true), "FORBIDDEN");
    await setPinned(admin, p, true);
    const p2 = await createPost(sara, { body: "Réunion vendredi" });
    assert.equal((await listPosts())[0].id, p); // pinned first
    assert.ok(p2);
  });
  it("only the author or an admin can delete", async () => {
    const p = await createPost(ali, { body: "Message à supprimer" });
    await rejects(() => deletePost(sara, p), "FORBIDDEN");
    await addComment(sara, p, "commentaire de sara");
    const c = (await listPosts()).find((x) => x.id === p)!.comments[0];
    await rejects(() => deleteComment(ali, c.id), "FORBIDDEN");
    await deleteComment(sara, c.id);
    await deletePost(ali, p);
    assert.equal((await listPosts()).some((x) => x.id === p), false);
    const p3 = await createPost(ali, { body: "Admin peut modérer" });
    await deletePost(admin, p3);
  });
  it("validates input", async () => {
    await rejects(() => createPost(ali, { body: "" }), "VALIDATION");
    await rejects(() => addComment(ali, "not-uuid", "hi"), "VALIDATION");
    await rejects(() => addComment(ali, "11111111-2222-3333-4444-555555555555", "hi"), "NOT_FOUND");
  });
  it("deleting a user removes their posts", async () => {
    const u = await createUser(admin, { username: "leaver", fullName: "Leaver", role: "worker" });
    const a = (await login("leaver", u.tempPassword, "10.0.0.1")).actor;
    const p = await createPost(a, { body: "Je pars bientôt" });
    await deleteUser(admin, a.id);
    assert.equal((await listPosts()).some((x) => x.id === p), false);
  });
});
