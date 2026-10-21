# CampaignHQ

A local campaign operations workspace for community managers and creators. This is the first working milestone, not the complete product.

## Run locally

Requires Node.js 24 (uses its built-in SQLite module) and npm.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open the address printed by Next.js on your own machine. For a production build:

```sh
npm run build
npm run start -- --hostname 127.0.0.1
```

In this cloud environment use `npm_config_cache=/tmp/npm-cache` if the default npm cache is not writable. No API keys or external services are needed. The npm scripts use Next.js’s supported Webpack mode. In a restricted cloud sandbox, build and browser commands may require permission to launch subprocesses and bind a local test port.

## Implemented

- Dashboard totals from SQLite, overdue tasks, deadline list, recent activity.
- Create, read, edit, archive, and delete campaigns; search, status filter, and sorting.
- Campaign project, description, platform, dates, URL, requirements, and notes.
- Linked tasks with priorities, notes, deadlines, four statuses, and completion dates.
- Server-side validation, empty/loading/error states, and responsive navigation.
- Campaign deletion confirmation and cascading deletion of linked tasks.

All date-only deadlines use UTC. A task becomes overdue the day after its deadline and stops being overdue when completed. Archived campaigns retain their tasks and history.

## How it works

`src/app/page.tsx` renders the dashboard and forms on the server. `src/app/actions.ts` validates form submissions and writes changes, then refreshes the page. `src/lib/store.ts` manages SQLite and activity records. `src/lib/validation.ts` holds reusable validation and deadline rules. Tailwind and shared CSS provide the responsive layout.

SQLite is a database stored in a local file: `data/campaignhq.sqlite`. Tables are created automatically. Set `CAMPAIGNHQ_DATA_DIR` to change the directory. The data directory is ignored by Git; restarting the app preserves records. Back up the whole data directory while the app is stopped. Never commit databases containing personal information. Persistent disk is required; this is not configured for ephemeral/serverless hosting.

## Verification

```sh
npm test
npm run lint
npm run build
npm run test:e2e
```

Unit/integration tests exercise invalid inputs, deadline boundaries, SQLite updates and cascading deletion. The browser workflow creates a campaign, reloads it, creates and completes an overdue task, checks dashboard totals, archives the campaign, and deletes it with its linked task. It also checks mobile horizontal overflow and captures mobile/desktop screenshots.

The browser suite starts a production server on port 3100 and uses a new temporary directory for isolated data on each run. Chromium is expected at `/usr/bin/chromium`; set `CHROMIUM_PATH` to use another installed Chromium. Browser tests do not touch the app's normal database.

## Limits and next milestones

This is single-user local software. There is no login or access control: bind to loopback and do not expose it publicly until authentication, authorization, and deployment protections are added. Do not enter wallet seed phrases, private keys, or authentication credentials.

The content planner, structured requirement checklist and draft warnings, currency-separated reward records, calendar filters, reporting, and CSV export are planned, not implemented. Requirements are currently stored as plain text. The deadline list is the initial scheduling view. There is no automatic publishing, reward verification, exchange-rate conversion, or demo data.

Validation failures explain the error but currently require reopening and filling in the form again. Task deletion is immediate; campaign deletion requires explicit confirmation. Activity is a convenience log, not a transactional audit trail. SQLite operations are synchronous and appropriate for this small local application; concurrent multi-user operation needs further design.
