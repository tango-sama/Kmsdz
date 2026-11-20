import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { useTestDb, getDb } from "../src/lib/db/index.ts";
import { login } from "../src/lib/auth/login.ts";
import { registerCustomer } from "../src/lib/auth/register.ts";
import { getActorByToken } from "../src/lib/auth/session.ts";
import { createUser, listUsers, listWorkers } from "../src/lib/portal/users.ts";
import { createJob, listJobs } from "../src/lib/portal/jobs.ts";
import { createFile, getFileForDownload, listFiles } from "../src/lib/portal/files.ts";
import { createPost } from "../src/lib/portal/news.ts";
import { PortalError, type Actor } from "../src/lib/portal/types.ts";

const rejects = (fn: () => Promise<unknown>, code: string) =>
  assert.rejects(fn, (e: unknown) => e instanceof PortalError && e.code === code, `expected ${code}`);

const PDF = new TextEncoder().encode("%PDF-1.4 plan");
let admin: Actor;
let customer: Actor;

before(async () => {
  await useTestDb();
  // a customer signs up BEFORE the first admin ever logs in: the admin bootstrap must still happen
  const c = await registerCustomer({ fullName: "Karim Client", email: "  Karim@Example.com ", password: "Good-pass-2026", confirm: "Good-pass-2026" });
  customer = c.actor;
  process.env.ADMIN_USERNAME = "boss";
  process.env.ADMIN_PASSWORD = "Sup3rSecret!";
  admin = (await login("boss", "Sup3rSecret!", "9.9.9.9")).actor;
});

describe("customer sign-up", () => {
  it("creates a customer (never staff), normalises the e-mail and opens a session", async () => {
    assert.equal(customer.role, "customer");
    assert.equal(customer.username, "karim@example.com");
    assert.equal(customer.mustChangePassword, false);
    const r = await registerCustomer({ fullName: "Lina", email: "lina@example.com", password: "Another-good-1", confirm: "Another-good-1" });
    assert.equal((await getActorByToken(r.token))?.role, "customer");
  });
  it("the admin bootstrap still works when customers exist first", () => {
    assert.equal(admin.role, "admin");
  });
  it("rejects duplicates, bad e-mails, weak or mismatching passwords", async () => {
    await rejects(() => registerCustomer({ fullName: "Dup", email: "KARIM@example.com", password: "Good-pass-2026", confirm: "Good-pass-2026" }), "EMAIL_TAKEN");
    await rejects(() => registerCustomer({ fullName: "X Y", email: "not-an-email", password: "Good-pass-2026", confirm: "Good-pass-2026" }), "VALIDATION");
    await rejects(() => registerCustomer({ fullName: "X", email: "x@example.com", password: "Good-pass-2026", confirm: "Good-pass-2026" }), "VALIDATION");
    await rejects(() => registerCustomer({ fullName: "Xx Yy", email: "w@example.com", password: "short", confirm: "short" }), "WEAK_PASSWORD");
    await rejects(() => registerCustomer({ fullName: "Xx Yy", email: "w@example.com", password: "Good-pass-2026", confirm: "Good-pass-2027" }), "PASSWORD_MISMATCH");
  });
  it("a visitor cannot choose a role: sign-up input has no role and a customer cannot create staff", async () => {
    const r = await registerCustomer({ fullName: "Evil", email: "evil@example.com", password: "Good-pass-2026", confirm: "Good-pass-2026", role: "admin" } as never);
    assert.equal(r.actor.role, "customer");
    const [row] = await (await getDb()).query("select role from users where username = 'evil@example.com'");
    assert.equal(row.role, "customer");
    await rejects(() => createUser(customer, { username: "sneaky", fullName: "Sneaky One", role: "admin" }), "FORBIDDEN");
  });
  it("the database itself refuses unknown roles", async () => {
    await assert.rejects(async () => (await getDb()).query("insert into users (username, full_name, role, password_hash) values ('z','z','superuser','x')"));
  });
});

describe("login", () => {
  it("customers log in with their e-mail (case-insensitive); staff with their username", async () => {
    const c = await login("KARIM@example.com", "Good-pass-2026", "2.2.2.2");
    assert.equal(c.actor.role, "customer");
    const a = await login("boss", "Sup3rSecret!", "3.3.3.3");
    assert.equal(a.actor.role, "admin");
  });
  it("admin-created workers still work and are the only way to get worker accounts", async () => {
    const w = await createUser(admin, { username: "ali", fullName: "Ali Benali", role: "worker" });
    const r = await login("ali", w.tempPassword, "4.4.4.4");
    assert.equal(r.actor.role, "worker");
    assert.ok(r.actor.mustChangePassword);
    await rejects(() => createUser(admin, { username: "cust", fullName: "Not Allowed", role: "customer" }), "VALIDATION");
    await rejects(() => createUser(admin, { username: "a@b.c", fullName: "Has At Sign", role: "worker" }), "VALIDATION");
  });
});

describe("customers are kept out of the portal data", () => {
  it("cannot see jobs or files, download files, or post news", async () => {
    const jobId = await createJob(admin, { title: "Chantier Touggourt", description: "", location: "", client: "", status: "new", priority: "normal", startDate: "", dueDate: "", audience: "all", userIds: [] });
    const fileId = await createFile(admin, { title: "Plan", description: "", category: "plans", jobId: "", audience: "all", userIds: [] }, { name: "plan.pdf", bytes: PDF });
    assert.ok(jobId && fileId);
    assert.equal((await listJobs(customer)).length, 0);
    assert.equal((await listFiles(customer)).length, 0);
    assert.equal(await getFileForDownload(customer, fileId), null);
    await rejects(() => createPost(customer, { title: "hi", body: "hello there" }), "FORBIDDEN");
    await rejects(() => listUsers(customer), "FORBIDDEN");
    await rejects(() => listWorkers(customer), "FORBIDDEN");
  });
  it("customers appear in the admin user list but never as assignable workers", async () => {
    const users = await listUsers(admin);
    assert.ok(users.some((u) => u.role === "customer" && u.username === "karim@example.com"));
    assert.ok(!(await listWorkers(admin)).some((w) => w.username.includes("@")));
  });
});
