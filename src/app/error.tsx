"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main>
      <h1>Could not load the workspace</h1>
      <p>
        Please try again. If this continues, check that the data directory is
        writable.
      </p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
