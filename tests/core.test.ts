import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { date, overdue, choice, id } from "../src/lib/validation";
test("validation rejects impossible dates, invalid statuses and IDs", () => {
  const f = new FormData();
  f.set("deadline", "2026-02-30");
  assert.throws(() => date(f, "deadline"));
  f.set("status", "fake");
  assert.throws(() => choice(f, "status", ["pending"]));
  f.set("id", "-1");
  assert.throws(() => id(f));
});
test("overdue uses date boundary and excludes completed tasks", () => {
  assert.equal(overdue("2026-10-20", "pending", "2026-10-21"), true);
  assert.equal(overdue("2026-10-21", "pending", "2026-10-21"), false);
  assert.equal(overdue("2026-10-20", "completed", "2026-10-21"), false);
  assert.equal(overdue("", "pending"), false);
});
test("SQLite persists updates, completion dates and cascading deletions", async () => {
  const dir = mkdtempSync(join(tmpdir(), "campaignhq-test-"));
  process.env.CAMPAIGNHQ_DATA_DIR = dir;
  const s = await import("../src/lib/store");
  s.saveCampaign({
    name: "Test campaign",
    project: "Project",
    description: "",
    platform: "X",
    start: "",
    deadline: "",
    url: "",
    requirements: "",
    notes: "",
    status: "active",
  });
  const c = s.campaigns()[0];
  assert.equal(c.name, "Test campaign");
  s.saveTask({
    campaignId: c.id,
    title: "Write post",
    status: "pending",
    priority: "high",
    deadline: "2026-01-01",
    notes: "",
    completedAt: "",
  });
  const t = s.tasks()[0];
  s.saveTask(
    { ...t, status: "completed", completedAt: "2026-10-21T00:00:00Z" },
    t.id,
  );
  assert.equal(s.tasks()[0].completedAt, "2026-10-21T00:00:00Z");
  s.saveCampaign({ ...c, status: "archived" }, c.id);
  assert.equal(s.campaigns()[0].status, "archived");
  assert.throws(() => s.saveTask({ ...t, campaignId: 99999 }));
  s.deleteCampaign(c.id);
  assert.equal(s.tasks().length, 0);
  assert.equal(s.campaigns().length, 0);
  assert.ok(s.activity().length >= 4);
  rmSync(dir, { recursive: true, force: true });
});
