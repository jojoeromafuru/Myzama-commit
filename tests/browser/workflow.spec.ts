import { test, expect } from "@playwright/test";
test("campaign and task lifecycle persists and updates dashboard", async ({
  page,
}) => {
  await page.goto("/?view=campaigns");
  await page.getByText("＋ Create campaign", { exact: true }).click();
  await page.getByLabel("Campaign name *").fill("Browser campaign");
  await page.getByLabel("Project *").fill("Browser project");
  await page
    .getByRole("button", { name: "Save campaign", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Browser campaign", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Browser campaign", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Tasks", exact: true }).click();
  await page.getByText("＋ Create task", { exact: true }).click();
  await page.getByLabel("Task title *").fill("Write first post");
  await page.getByLabel("Deadline (UTC)").fill("2020-01-01");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(page.getByText("2020-01-01 · Overdue")).toBeVisible();
  await page.getByText("Edit task / update status", { exact: true }).click();
  await page.getByRole("combobox", { name: "Status", exact: true }).selectOption("completed");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await expect(page.getByText(/2020-01-01 · Completed/)).toBeVisible();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(
    page
      .locator(".stats .panel")
      .filter({ hasText: "Completed tasks" })
      .locator(".number"),
  ).toHaveText("1");
  await expect(
    page
      .locator(".stats .panel")
      .filter({ hasText: "Overdue tasks" })
      .locator(".number"),
  ).toHaveText("0");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Campaigns", exact: true }).click();
  await page.getByText("Edit campaign / archive", { exact: true }).click();
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .last()
    .selectOption("archived");
  await page
    .getByRole("button", { name: "Save campaign", exact: true })
    .click();
  await expect(page.locator("article .badge")).toHaveText("archived");
  await page.getByText("Delete campaign", { exact: true }).click();
  await page.getByLabel("I confirm permanent deletion").check();
  await page.getByRole("button", { name: "Delete campaign and tasks" }).click();
  await expect(
    page.getByRole("heading", { name: "No campaigns found" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Tasks", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No tasks yet" }),
  ).toBeVisible();
});
