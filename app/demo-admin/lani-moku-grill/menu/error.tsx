"use client";

import { ActionButton } from "@/design-system";

export default function PhotoEditorError({ reset }: { reset: () => void }) {
  return (
    <main id="main" tabIndex={-1}>
      <h1>The photo preview could not be updated</h1>
      <p role="alert">
        An unexpected error occurred. No photo was uploaded or saved to the
        server.
      </p>
      <ActionButton onClick={reset}>Try again</ActionButton>
    </main>
  );
}
