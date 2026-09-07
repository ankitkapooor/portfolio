"use client";

import { useEffect, useState } from "react";
import { deleteLocalData, listComparisons } from "@/lib/local-store";

/**
 * Local data controls (BRD section 8).
 *
 * Comparison choices are kept in IndexedDB in the visitor's browser. Nothing is
 * sent anywhere, so "Delete local data" deletes the database rather than asking a
 * server to forget something.
 */
export function LocalDataPanel({ onCleared }: { onCleared: () => void }) {
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const refresh = () => {
    listComparisons()
      .then((items) => setCount(items.length))
      .catch(() => setCount(null));
  };

  useEffect(refresh, []);

  const clear = async () => {
    await deleteLocalData();
    setCount(0);
    setStatus("Local data deleted. Panel order will be reseeded on your next visit.");
    onCleared();
  };

  return (
    <section className="localDataPanel" aria-labelledby="local-data-heading">
      <h2 id="local-data-heading" className="pageSectionTitle">
        Your local data
      </h2>
      <p className="measure">
        {count === null
          ? "Reading local storage…"
          : `${count} comparison ${count === 1 ? "record is" : "records are"} stored in this browser.`}{" "}
        They hold the sample id, which output went in which panel, your choice, and
        your reason. There is no account, no server copy, and no analytics call.
      </p>
      <button
        type="button"
        className="button buttonSecondary"
        onClick={() => void clear()}
        data-testid="delete-local-data"
      >
        Delete local data
      </button>
      {status ? (
        <p className="fieldHint" role="status" data-testid="local-data-status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
