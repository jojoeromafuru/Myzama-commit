import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
export type Campaign = {
  id: number;
  name: string;
  project: string;
  description: string;
  platform: string;
  start: string;
  deadline: string;
  url: string;
  requirements: string;
  notes: string;
  status: string;
};
export type Task = {
  id: number;
  campaignId: number;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  notes: string;
  completedAt: string;
};
const dir = process.env.CAMPAIGNHQ_DATA_DIR || path.join(process.cwd(), "data");
mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(path.join(dir, "campaignhq.sqlite"));
db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS campaigns (id INTEGER PRIMARY KEY, name TEXT NOT NULL, project TEXT NOT NULL, description TEXT NOT NULL, platform TEXT NOT NULL, start TEXT NOT NULL, deadline TEXT NOT NULL, url TEXT NOT NULL, requirements TEXT NOT NULL, notes TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, campaignId INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE, title TEXT NOT NULL, status TEXT NOT NULL, priority TEXT NOT NULL, deadline TEXT NOT NULL, notes TEXT NOT NULL, completedAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS activity (id INTEGER PRIMARY KEY, message TEXT NOT NULL, createdAt TEXT NOT NULL);`);
export function campaigns() {
  return db
    .prepare("SELECT * FROM campaigns ORDER BY id DESC")
    .all() as Campaign[];
}
export function tasks() {
  return db.prepare("SELECT * FROM tasks ORDER BY id DESC").all() as Task[];
}
export function activity() {
  return db
    .prepare("SELECT * FROM activity ORDER BY id DESC LIMIT 8")
    .all() as { id: number; message: string; createdAt: string }[];
}
function log(message: string) {
  db.prepare("INSERT INTO activity(message,createdAt) VALUES (?,?)").run(
    message,
    new Date().toISOString(),
  );
}
export function saveCampaign(c: Omit<Campaign, "id">, id?: number) {
  const values = [
    c.name,
    c.project,
    c.description,
    c.platform,
    c.start,
    c.deadline,
    c.url,
    c.requirements,
    c.notes,
    c.status,
  ];
  if (id) {
    if (
      !db
        .prepare(
          "UPDATE campaigns SET name=?,project=?,description=?,platform=?,start=?,deadline=?,url=?,requirements=?,notes=?,status=? WHERE id=?",
        )
        .run(...values, id).changes
    )
      throw new Error("Campaign no longer exists.");
  } else
    db.prepare(
      "INSERT INTO campaigns(name,project,description,platform,start,deadline,url,requirements,notes,status) VALUES (?,?,?,?,?,?,?,?,?,?)",
    ).run(...values);
  log(`${id ? "Updated" : "Created"} campaign: ${c.name}`);
}
export function deleteCampaign(id: number) {
  db.prepare("DELETE FROM campaigns WHERE id=?").run(id);
  log("Deleted campaign and its linked tasks");
}
export function saveTask(t: Omit<Task, "id">, id?: number) {
  const values = [
    t.campaignId,
    t.title,
    t.status,
    t.priority,
    t.deadline,
    t.notes,
    t.completedAt,
  ];
  if (id) {
    if (
      !db
        .prepare(
          "UPDATE tasks SET campaignId=?,title=?,status=?,priority=?,deadline=?,notes=?,completedAt=? WHERE id=?",
        )
        .run(...values, id).changes
    )
      throw new Error("Task no longer exists.");
  } else
    db.prepare(
      "INSERT INTO tasks(campaignId,title,status,priority,deadline,notes,completedAt) VALUES (?,?,?,?,?,?,?)",
    ).run(...values);
  log(`${id ? "Updated" : "Created"} task: ${t.title}`);
}
export function deleteTask(id: number) {
  db.prepare("DELETE FROM tasks WHERE id=?").run(id);
  log("Deleted task");
}
