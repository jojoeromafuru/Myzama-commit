"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as store from "@/lib/store";
import { text, choice, date, id } from "@/lib/validation";
export async function mutate(f: FormData) {
  const kind = String(f.get("kind"));
  let error = "";
  try {
    if (kind === "campaign") {
      const url = text(f, "url");
      if (url && !/^https?:$/.test(new URL(url).protocol))
        throw new Error("Use an HTTP or HTTPS campaign URL.");
      const start = date(f, "start"),
        deadline = date(f, "deadline");
      if (start && deadline && start > deadline)
        throw new Error("Deadline must be on or after the start date.");
      store.saveCampaign(
        {
          name: text(f, "name", true),
          project: text(f, "project", true),
          description: text(f, "description"),
          platform: choice(f, "platform", ["X", "Telegram", "Other"]),
          start,
          deadline,
          url,
          requirements: text(f, "requirements"),
          notes: text(f, "notes"),
          status: choice(f, "status", ["active", "completed", "archived"]),
        },
        f.get("id") ? id(f) : undefined,
      );
    } else if (kind === "task") {
      const status = choice(f, "status", [
        "pending",
        "in-progress",
        "completed",
        "blocked",
      ]);
      const taskId = f.get("id") ? id(f) : undefined;
      const previous = store.tasks().find((t) => t.id === taskId);
      store.saveTask(
        {
          campaignId: id(f, "campaignId"),
          title: text(f, "title", true),
          status,
          priority: choice(f, "priority", ["low", "medium", "high"]),
          deadline: date(f, "deadline"),
          notes: text(f, "notes"),
          completedAt:
            status === "completed"
              ? previous?.completedAt || new Date().toISOString()
              : "",
        },
        taskId,
      );
    } else if (kind === "deleteCampaign") {
      if (f.get("confirm") !== "yes")
        throw new Error("Confirm deletion first.");
      store.deleteCampaign(id(f));
    } else if (kind === "deleteTask") store.deleteTask(id(f));
    else throw new Error("Unknown action.");
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not save your changes.";
    if (error.includes("FOREIGN KEY")) error = "Select an existing campaign.";
  }
  revalidatePath("/");
  const view = kind.toLowerCase().includes("task") ? "tasks" : "campaigns";
  redirect(
    `/?view=${view}${error ? `&error=${encodeURIComponent(error)}` : "&saved=1"}`,
  );
}
