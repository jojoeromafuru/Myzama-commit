import Link from "next/link";
import {
  campaigns,
  tasks,
  activity,
  type Campaign,
  type Task,
} from "@/lib/store";
import { overdue } from "@/lib/validation";
import { mutate } from "./actions";
export const dynamic = "force-dynamic";
function Field({
  name,
  label,
  value = "",
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  value?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        maxLength={10000}
      />
    </label>
  );
}
function Select({
  name,
  label,
  values,
  value,
}: {
  name: string;
  label: string;
  values: string[];
  value?: string;
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={value}>
        {values.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}
function CampaignForm({ c }: { c?: Campaign }) {
  return (
    <form action={mutate} className="fields">
      <input type="hidden" name="kind" value="campaign" />
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field name="name" label="Campaign name *" value={c?.name} required />
      <Field name="project" label="Project *" value={c?.project} required />
      <Select
        name="platform"
        label="Platform"
        values={["X", "Telegram", "Other"]}
        value={c?.platform}
      />
      <Select
        name="status"
        label="Status"
        values={["active", "completed", "archived"]}
        value={c?.status}
      />
      <Field name="start" label="Start date" type="date" value={c?.start} />
      <Field
        name="deadline"
        label="Deadline (UTC)"
        type="date"
        value={c?.deadline}
      />
      <Field name="url" label="Campaign URL" type="url" value={c?.url} />
      {["description", "requirements", "notes"].map((n) => (
        <label key={n} className="wide">
          {n[0].toUpperCase() + n.slice(1)}
          <textarea
            name={n}
            maxLength={10000}
            defaultValue={c?.[n as "notes"]}
          />
        </label>
      ))}
      <div className="wide">
        <button>Save campaign</button>
      </div>
    </form>
  );
}
function TaskForm({ t, cs }: { t?: Task; cs: Campaign[] }) {
  return (
    <form action={mutate} className="fields">
      <input type="hidden" name="kind" value="task" />
      {t && <input type="hidden" name="id" value={t.id} />}
      <Field name="title" label="Task title *" value={t?.title} required />
      <label>
        Campaign *
        <select name="campaignId" defaultValue={t?.campaignId} required>
          {cs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <Select
        name="status"
        label="Status"
        values={["pending", "in-progress", "completed", "blocked"]}
        value={t?.status}
      />
      <Select
        name="priority"
        label="Priority"
        values={["medium", "high", "low"]}
        value={t?.priority}
      />
      <Field
        name="deadline"
        label="Deadline (UTC)"
        type="date"
        value={t?.deadline}
      />
      <label>
        Notes
        <textarea name="notes" maxLength={10000} defaultValue={t?.notes} />
      </label>
      <div className="wide">
        <button>Save task</button>
      </div>
    </form>
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const view = ["dashboard", "campaigns", "tasks"].includes(q.view || "")
    ? q.view!
    : "dashboard";
  const cs = campaigns(),
    ts = tasks(),
    events = activity();
  const filtered = cs
    .filter(
      (c) =>
        (!q.status || c.status === q.status) &&
        (!q.q ||
          `${c.name} ${c.project}`.toLowerCase().includes(q.q.toLowerCase())),
    )
    .sort((a, b) =>
      q.sort === "name"
        ? a.name.localeCompare(b.name)
        : q.sort === "deadline"
          ? (a.deadline || "9999").localeCompare(b.deadline || "9999")
          : b.id - a.id,
    );
  const deadlines = [
    ...cs
      .filter((c) => c.status === "active" && c.deadline)
      .map((c) => ({
        key: `c${c.id}`,
        title: c.name,
        date: c.deadline,
        type: "Campaign",
      })),
    ...ts
      .filter((t) => t.status !== "completed" && t.deadline)
      .map((t) => ({
        key: `t${t.id}`,
        title: t.title,
        date: t.deadline,
        type: "Task",
      })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <aside>
        <Link
          href="/"
          className="row"
          style={{
            justifyContent: "flex-start",
            fontSize: 21,
            fontWeight: 800,
          }}
        >
          <span className="badge">HQ</span> CampaignHQ
        </Link>
        <p
          className="muted"
          style={{ fontSize: 11, marginTop: 38, letterSpacing: 2 }}
        >
          WORKSPACE
        </p>
        <nav>
          {["dashboard", "campaigns", "tasks"].map((v) => (
            <Link
              key={v}
              href={`/?view=${v}`}
              className={v === view ? "active" : ""}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </Link>
          ))}
        </nav>
        <p className="muted" style={{ marginTop: 36, fontSize: 12 }}>
          Local workspace
          <br />
          Your data stays on this machine.
        </p>
      </aside>
      <main>
        <div className="row">
          <div>
            <p className="muted">WORKSPACE / {view.toUpperCase()}</p>
            <h1>
              {view === "dashboard"
                ? "Your campaign overview"
                : view === "campaigns"
                  ? "Campaigns"
                  : "Task board"}
            </h1>
            <p className="muted">
              {view === "dashboard"
                ? "A clear view of what’s moving, what’s due, and what needs attention."
                : view === "campaigns"
                  ? "Keep every project, requirement, and deadline in one place."
                  : "Turn campaign requirements into manageable next steps."}
            </p>
          </div>
          <span className="badge">● Local · single user</span>
        </div>
        {q.error && (
          <p role="alert" className="notice error">
            {q.error} Your changes were not saved. Reopen the form to try again.
          </p>
        )}
        {q.saved && (
          <p role="status" className="notice">
            Changes saved.
          </p>
        )}
        {view === "dashboard" && (
          <>
            <div className="grid stats">
              {[
                ["Total campaigns", cs.length],
                [
                  "Active campaigns",
                  cs.filter((c) => c.status === "active").length,
                ],
                [
                  "Completed tasks",
                  ts.filter((t) => t.status === "completed").length,
                ],
                [
                  "Overdue tasks",
                  ts.filter((t) => overdue(t.deadline, t.status)).length,
                ],
              ].map(([label, n]) => (
                <div className="panel" key={label}>
                  <span className="muted">{label}</span>
                  <div className="number">{n}</div>
                </div>
              ))}
            </div>
            <section className="panel">
              <div className="row">
                <h2>Deadlines to watch</h2>
                <Link className="button" href="/?view=campaigns">
                  Manage campaigns
                </Link>
              </div>
              {deadlines.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Type</th>
                        <th>Deadline · UTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deadlines.slice(0, 10).map((d) => (
                        <tr key={d.key}>
                          <td>{d.title}</td>
                          <td>{d.type}</td>
                          <td
                            className={
                              overdue(d.date, "pending") ? "overdue" : ""
                            }
                          >
                            {d.date}
                            {overdue(d.date, "pending") ? " · Overdue" : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">
                  No deadlines yet. Create a campaign and add your first task.
                </p>
              )}
            </section>
            <section className="panel">
              <h2>Recent activity</h2>
              {events.length ? (
                events.map((e) => (
                  <div
                    className="row"
                    key={e.id}
                    style={{
                      padding: "12px 0",
                      borderBottom: "1px solid #edf0f2",
                    }}
                  >
                    <span>{e.message}</span>
                    <time className="muted">
                      {e.createdAt.slice(0, 16).replace("T", " ")} UTC
                    </time>
                  </div>
                ))
              ) : (
                <p className="muted">
                  Your campaign and task changes will appear here.
                </p>
              )}
            </section>
            <p className="muted">
              Reward tracking will be added in a later milestone. No reward
              income is assumed.
            </p>
          </>
        )}
        {view === "campaigns" && (
          <>
            <details className="panel">
              <summary>＋ Create campaign</summary>
              <CampaignForm />
            </details>
            <form className="panel row">
              <input type="hidden" name="view" value="campaigns" />
              <label style={{ flex: 1 }}>
                Search campaigns
                <input
                  name="q"
                  placeholder="Campaign or project name"
                  defaultValue={q.q}
                />
              </label>
              <Select
                name="status"
                label="Status"
                values={["", "active", "completed", "archived"]}
                value={q.status}
              />
              <Select
                name="sort"
                label="Sort"
                values={["newest", "name", "deadline"]}
                value={q.sort}
              />
              <button>Apply filters</button>
            </form>
            <p className="muted">{filtered.length} campaigns</p>
            {filtered.map((c) => (
              <article className="panel" key={c.id}>
                <div className="row">
                  <div>
                    <h2>{c.name}</h2>
                    <p className="muted">
                      {c.project} · {c.platform} · {c.deadline || "No deadline"}
                    </p>
                  </div>
                  <span className="badge">{c.status}</span>
                </div>
                <p style={{ whiteSpace: "pre-wrap" }}>{c.description}</p>
                {c.url && (
                  <p>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Open campaign ↗
                    </a>
                  </p>
                )}
                {c.requirements && (
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    <strong>Requirements</strong>
                    <br />
                    {c.requirements}
                  </p>
                )}
                {c.notes && (
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    <strong>Notes</strong>
                    <br />
                    {c.notes}
                  </p>
                )}
                <details>
                  <summary>Edit campaign / archive</summary>
                  <CampaignForm c={c} />
                </details>
                <details style={{ marginTop: 20 }}>
                  <summary className="overdue">Delete campaign</summary>
                  <form action={mutate}>
                    <input type="hidden" name="kind" value="deleteCampaign" />
                    <input type="hidden" name="id" value={c.id} />
                    <p>
                      This permanently deletes this campaign and all its linked
                      tasks.
                    </p>
                    <label>
                      <input
                        type="checkbox"
                        name="confirm"
                        value="yes"
                        required
                      />
                      I confirm permanent deletion
                    </label>
                    <button className="danger" style={{ marginTop: 12 }}>
                      Delete campaign and tasks
                    </button>
                  </form>
                </details>
              </article>
            ))}
            {!filtered.length && (
              <section className="panel">
                <h2>No campaigns found</h2>
                <p className="muted">
                  Create your first campaign or adjust your filters.
                </p>
              </section>
            )}
          </>
        )}
        {view === "tasks" && (
          <>
            {cs.length ? (
              <details className="panel">
                <summary>＋ Create task</summary>
                <TaskForm cs={cs} />
              </details>
            ) : (
              <p className="notice">
                Create a campaign first to start adding tasks.
              </p>
            )}
            {ts.map((t) => (
              <article className="panel" key={t.id}>
                <div className="row">
                  <div>
                    <h2>{t.title}</h2>
                    <p className="muted">
                      {cs.find((c) => c.id === t.campaignId)?.name} ·{" "}
                      {t.priority} priority
                    </p>
                  </div>
                  <span className="badge">{t.status}</span>
                </div>
                <p
                  className={
                    overdue(t.deadline, t.status) ? "overdue" : "muted"
                  }
                >
                  {t.deadline || "No deadline"}
                  {overdue(t.deadline, t.status) ? " · Overdue" : ""}
                  {t.completedAt
                    ? ` · Completed ${t.completedAt.slice(0, 10)}`
                    : ""}
                </p>
                {t.notes && <p>{t.notes}</p>}
                <details>
                  <summary>Edit task / update status</summary>
                  <TaskForm t={t} cs={cs} />
                </details>
                <form action={mutate} style={{ marginTop: 16 }}>
                  <input type="hidden" name="kind" value="deleteTask" />
                  <input type="hidden" name="id" value={t.id} />
                  <button className="danger">Delete task</button>
                </form>
              </article>
            ))}
            {!ts.length && (
              <section className="panel">
                <h2>No tasks yet</h2>
                <p className="muted">
                  Add tasks to break your campaign into clear next steps.
                </p>
              </section>
            )}
          </>
        )}
        <footer>
          CampaignHQ · Milestone 1 · All dates use UTC. No automatic publishing
          or guaranteed rewards.
        </footer>
      </main>
    </>
  );
}
