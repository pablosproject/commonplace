// @vitest-environment happy-dom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { App } from "../src/App";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

test.each([
  ["/", "A commonplace book for video."],
  ["/preview", "This preview link is broken"],
  ["/r/AAAAAAAAAAAAAAAAAAAAAA", "This link is incomplete"],
  ["/unknown", "Page not found"],
])("renders the page at %s", async (path, message) => {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  });

  expect(container.textContent).toContain(message);
});

test("navigates home from an incomplete shared link", async () => {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={["/r/AAAAAAAAAAAAAAAAAAAAAA"]}>
        <App />
      </MemoryRouter>,
    );
  });

  const home = container.querySelector<HTMLAnchorElement>('a[href="/"]');
  expect(home).not.toBeNull();

  await act(async () => home?.click());

  expect(container.textContent).toContain("A commonplace book for video.");
});
