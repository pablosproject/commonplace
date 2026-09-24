import { useEffect, useState } from "react";
import "./App.css";

type HealthResponse = {
  ok: true;
  service: "api";
};

type ApiState =
  | { status: "checking" }
  | { status: "ready"; health: HealthResponse }
  | { status: "error" };

export function App() {
  const [apiState, setApiState] = useState<ApiState>({ status: "checking" });

  useEffect(() => {
    let ignore = false;

    fetch("/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Health check failed");
        }

        return response.json() as Promise<HealthResponse>;
      })
      .then((health) => {
        if (!ignore) {
          setApiState({ status: "ready", health });
        }
      })
      .catch(() => {
        if (!ignore) {
          setApiState({ status: "error" });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="shell">
      <section className="intro">
        <p className="eyebrow">Video Recaps</p>
        <h1>Browse useful summaries without watching the whole video first.</h1>
        <p>
          This is the first runnable slice: a Vite React frontend talking to a
          Hono API. The seeded recap browsing UI comes next.
        </p>
      </section>

      <section className="status-panel" aria-live="polite">
        <span className={`status-dot ${apiState.status}`} />
        <div>
          <h2>API status</h2>
          <p>{statusText(apiState)}</p>
        </div>
      </section>
    </main>
  );
}

function statusText(apiState: ApiState) {
  if (apiState.status === "checking") {
    return "Checking the local API...";
  }

  if (apiState.status === "error") {
    return "Could not reach the local API on /api/health.";
  }

  return `${apiState.health.service} is responding.`;
}
