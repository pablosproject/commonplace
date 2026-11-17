// @vitest-environment jsdom
import type { ReactNode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { decodePreviewHash, type Recap } from "@commonplace/video-util";
import { App } from "../src/App";
import { loadSharedRecap, invalidateLink } from "../src/shared/sharing/api";
import { LibraryStorage } from "../src/shared/library/storage";
import {
  adminSource,
  expiresAt,
  linkId,
  recap,
  shareKey,
  source,
} from "./library-fixtures";

vi.mock("@commonplace/video-util", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@commonplace/video-util")>()),
  decodePreviewHash: vi.fn(),
}));
vi.mock("../src/shared/recap/RecapView", () => ({
  RecapView: ({
    recap,
    actions,
    nav,
    savedRecap,
    onPlaybackTime,
  }: {
    recap: Recap;
    actions?: ReactNode;
    nav?: ReactNode;
    savedRecap?: { positionSeconds?: number };
    onPlaybackTime?: (seconds: number) => void;
  }) => (
    <>
      <header>
        {nav}
        {actions}
      </header>
      <main
        data-position={savedRecap?.positionSeconds ?? 0}
        onClick={() => onPlaybackTime?.(120)}
      >
        <h1>{recap.video.title}</h1>
        <p>{recap.abstract}</p>
      </main>
    </>
  ),
}));
vi.mock("../src/shared/sharing/api", () => ({
  loadSharedRecap: vi.fn(),
  invalidateLink: vi.fn(),
}));
const testLibraries: LibraryStorage[] = [];

function newTestLibrary() {
  const library = new LibraryStorage(localStorage);
  testLibraries.push(library);
  return library;
}

function readLibrary() {
  return newTestLibrary().getSnapshot().entries;
}
function saveRecap(
  recap: Recap,
  source: {
    url: string;
    management?: { ownerSecret: string; expiresAt: string };
  },
  replace = false,
) {
  const url = new URL(source.url, "https://example.com");
  const management = source.management
    ? {
        ...source.management,
        linkId: url.pathname.slice(3),
        key: url.hash.slice(3),
      }
    : undefined;
  return newTestLibrary().save({ recap, management }, replace);
}

const writeText = vi.fn(async (_text: string) => {});
const path = source.url;
const adminPath = `${path}&m=${adminSource.management.ownerSecret}`;

function open(url: string) {
  window.dispatchEvent(
    new StorageEvent("storage", { key: "commonplace.library.v1" }),
  );
  return render(
    <MemoryRouter initialEntries={[url]}>
      <App />
    </MemoryRouter>,
  );
}
async function options() {
  const trigger = await screen.findByRole("button", {
    name: /^(Save recap|Saved recap options)$/,
  });
  fireEvent.click(trigger);
  await screen.findByRole("dialog", { name: "Your recaps" });
  return trigger;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  localStorage.clear();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.mocked(decodePreviewHash).mockResolvedValue(recap);
  vi.mocked(loadSharedRecap).mockResolvedValue({
    status: "ready",
    data: { recap, expiresAt },
  });
});
afterEach(() => {
  cleanup();
  for (const library of testLibraries.splice(0)) {
    library.dispose();
  }
  vi.unstubAllGlobals();
});

test("admin saving is explicit through the header plus, with no panel in the notes", async () => {
  open(adminPath);
  await screen.findByRole("button", { name: "Save recap" });
  expect(readLibrary()).toEqual([]);
  expect(screen.queryByText(/Management access will also be saved/)).toBeNull();
  expect(screen.getAllByRole("button", { name: /Manage link,/ })).toHaveLength(
    1,
  );
  expect(
    screen.getByRole("button", { name: /Manage link,/ }).closest("header"),
  ).toBeTruthy();
  expect(screen.getByRole("main").querySelector("button")).toBeNull();
  await options();
  expect(readLibrary()).toEqual([]);
  expect(screen.getByText(/Management access will also be saved/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Save in this browser" }));
  expect(
    await screen.findByRole("button", { name: "Saved recap options" }),
  ).toBeTruthy();
  expect(screen.queryByRole("dialog", { name: "Your recaps" })).toBeNull();
  expect(readLibrary()[0].management).toEqual({
    ...adminSource.management,
    linkId,
    key: shareKey,
  });
});

test("reader UI uses the same plus without granting management access", async () => {
  open(path);
  await options();
  expect(screen.queryByRole("button", { name: /Manage link,/ })).toBeNull();
  expect(screen.queryByText(/Management access will also be saved/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save in this browser" }));
  expect(readLibrary()[0].management).toBeUndefined();
});

test("preview saving preserves its normalized source without automatic persistence", async () => {
  open("/preview#d=abc&v=1");
  await options();
  expect(readLibrary()).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "Save in this browser" }));
  expect(readLibrary()[0].management).toBeUndefined();
  expect(loadSharedRecap).not.toHaveBeenCalled();
});

test("upgrading reader access requires another explicit save", async () => {
  saveRecap(recap, source);
  open(adminPath);
  await options();
  expect(readLibrary()[0].management).toBeUndefined();
  fireEvent.click(
    screen.getByRole("button", { name: "Save administrator access" }),
  );
  expect(readLibrary()[0].management).toEqual({
    ...adminSource.management,
    linkId,
    key: shareKey,
  });
});

test("new management credentials replace saved access", async () => {
  saveRecap(recap, adminSource);
  open(`${path}&m=${"x".repeat(43)}`);
  await options();
  fireEvent.click(
    screen.getByRole("button", { name: "Save administrator access" }),
  );
  expect(readLibrary()[0].management).toEqual({
    ...adminSource.management,
    ownerSecret: "x".repeat(43),
    linkId,
    key: shareKey,
  });
});

test("different contents require replacement confirmation and preserve existing credentials", async () => {
  saveRecap(recap, adminSource);
  vi.mocked(loadSharedRecap).mockResolvedValue({
    status: "ready",
    data: {
      recap: { ...recap, abstract: "New summary" },
      expiresAt,
    },
  });
  open(path);
  await screen.findByRole("button", { name: "View link recap" });
  expect(screen.getByText(recap.abstract)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "View link recap" }));
  expect(screen.getByText("New summary")).toBeTruthy();
  await options();
  fireEvent.click(screen.getByRole("button", { name: "Save in this browser" }));
  expect(readLibrary()[0].recap.abstract).toBe(recap.abstract);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(
    screen.queryByRole("button", { name: "Replace saved recap" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save in this browser" }));
  fireEvent.click(screen.getByRole("button", { name: "Replace saved recap" }));
  expect(readLibrary()[0].recap.abstract).toBe("New summary");
  expect(readLibrary()[0].management).toEqual({
    ...adminSource.management,
    linkId,
    key: shareKey,
  });
});

test.each(["/preview#d=abc&v=1", path, `/saved/${recap.video.id}`])(
  "restores and saves playback from %s",
  async (url) => {
    saveRecap(recap, source);
    newTestLibrary().saveTime(recap.video.id, 45);
    open(url);
    await screen.findByRole("heading", { name: recap.video.title });
    const main = screen.getByRole("main");
    expect(main.getAttribute("data-position")).toBe("45");
    fireEvent.click(main);
    expect(readLibrary()[0].positionSeconds).toBe(120);
  },
);

test("saving during preview playback starts recording progress", async () => {
  open("/preview#d=abc&v=1");
  await screen.findByRole("heading", { name: recap.video.title });
  fireEvent.click(screen.getByRole("main"));
  expect(readLibrary()).toEqual([]);
  await options();
  fireEvent.click(screen.getByRole("button", { name: "Save in this browser" }));
  fireEvent.click(screen.getByRole("main"));
  expect(readLibrary()[0].positionSeconds).toBe(120);
});

test("a different managed link does not associate its credentials with the displayed local recap", async () => {
  saveRecap(recap, source);
  vi.mocked(loadSharedRecap).mockResolvedValue({
    status: "ready",
    data: { recap: { ...recap, abstract: "Link summary" }, expiresAt },
  });
  open(adminPath);
  await screen.findByRole("button", { name: "View link recap" });
  expect(screen.queryByRole("button", { name: /Manage link,/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "View link recap" }));
  expect(screen.getByRole("button", { name: /Manage link,/ })).toBeTruthy();
  expect(readLibrary()[0].management).toBeUndefined();
});

test("preview prefers the saved recap and allows viewing a different link recap", async () => {
  saveRecap(recap, source);
  vi.mocked(decodePreviewHash).mockResolvedValue({
    ...recap,
    abstract: "Link summary",
  });
  open("/preview#d=abc&v=1");
  expect(await screen.findByText(recap.abstract)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "View link recap" }));
  expect(screen.getByText("Link summary")).toBeTruthy();
});

test("failed writes report an error instead of changing the plus to a check", async () => {
  open(path);
  await options();
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Full", "QuotaExceededError");
  });
  fireEvent.click(screen.getByRole("button", { name: "Save in this browser" }));
  expect(screen.getByRole("alert").textContent).toContain("Could not save");
  expect(
    screen.queryByRole("button", { name: "Saved recap options" }),
  ).toBeNull();
});

test("Home C keeps the original hero and links to a separate alphabetical collection", async () => {
  saveRecap(
    { ...recap, video: { ...recap.video, title: "Zulu" } },
    adminSource,
  );
  saveRecap(
    { ...recap, video: { ...recap.video, id: "12345678901", title: "Alpha" } },
    { url: `/r/BBBBBBBBBBBBBBBBBBBBBB#k=${shareKey}` },
  );
  open("/");
  expect(screen.getByText("A commonplace book for video.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Install the skill" })).toBeTruthy();
  expect(screen.getByText("2 saved recaps")).toBeTruthy();
  expect(screen.queryByText("Zulu")).toBeNull();
  expect(screen.queryByText("Alpha")).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "View your recaps" }));
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
  ).toEqual(["Alpha", "Zulu"]);
  expect(screen.getAllByText("Example channel")).toHaveLength(2);
  expect(screen.getAllByText(recap.mainTakeaway)).toHaveLength(2);
  expect(screen.queryByText(recap.abstract)).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "Zulu" }));
  expect(
    await screen.findByRole("button", { name: "Saved recap options" }),
  ).toBeTruthy();
  expect(screen.getAllByRole("button", { name: /Manage link,/ })).toHaveLength(
    1,
  );
  expect(loadSharedRecap).not.toHaveBeenCalled();
});

test("the collection has an empty state and does not invent missing authors", () => {
  const view = open("/saved");
  expect(screen.getByText("No saved recaps yet")).toBeTruthy();
  view.unmount();
  const { channel: _, ...video } = recap.video;
  saveRecap({ ...recap, video }, source);
  open("/saved");
  expect(screen.getByText("Author unavailable")).toBeTruthy();
  expect(screen.getByRole("heading", { name: recap.video.title })).toBeTruthy();
});

test("the collection switches between list and grid views", () => {
  saveRecap(
    {
      ...recap,
      video: {
        ...recap.video,
        duration: { seconds: 2538, formatted: "00:42:18" },
      },
    },
    source,
  );
  newTestLibrary().saveTime(recap.video.id, 1572);
  open("/saved");
  const list = screen.getByRole("button", { name: "List view" });
  const grid = screen.getByRole("button", { name: "Grid view" });
  expect(list.getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByText(recap.mainTakeaway)).toBeTruthy();
  expect(screen.getByText("42:18")).toBeTruthy();
  expect(
    screen
      .getByRole("progressbar", { name: "Watched" })
      .getAttribute("aria-valuetext"),
  ).toBe("26:12 of 42:18");

  fireEvent.click(grid);
  expect(grid.getAttribute("aria-pressed")).toBe("true");
  expect(list.getAttribute("aria-pressed")).toBe("false");
  expect(screen.queryByText(recap.mainTakeaway)).toBeNull();
  expect(screen.getByRole("heading", { name: recap.video.title })).toBeTruthy();
});

test("a missing local copy explains that its address is not a share link", () => {
  open(`/saved/${recap.video.id}`);
  expect(screen.getByText("No saved recap in this browser")).toBeTruthy();
  expect(
    screen.getByText(/This address opens a local copy, not a share link/),
  ).toBeTruthy();
  expect(loadSharedRecap).not.toHaveBeenCalled();
});

test("a retained administrator link is not shared as the replaced recap", async () => {
  saveRecap(recap, adminSource);
  const current = { url: `/r/BBBBBBBBBBBBBBBBBBBBBB#k=${shareKey}` };
  saveRecap({ ...recap, abstract: "Replacement" }, current, true);
  open(`/saved/${recap.video.id}`);
  await options();
  expect(screen.queryByRole("button", { name: "Copy reader link" })).toBeNull();
  expect(screen.getByText(/may open a different recap/)).toBeTruthy();
});

test("local copies remain readable and shareable without checking link availability", async () => {
  saveRecap(recap, {
    ...adminSource,
    management: {
      ...adminSource.management,
      expiresAt: "2020-01-01T00:00:00.000Z",
    },
  });
  open(`/saved/${recap.video.id}`);
  expect(screen.getByText(recap.abstract)).toBeTruthy();
  await options();
  expect(
    screen.queryByText(/The original link has expired or was invalidated/),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Copy reader link" }));
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith(
      new URL(source.url, window.location.origin).href,
    ),
  );
  expect(loadSharedRecap).not.toHaveBeenCalled();
});

test("blocked clipboard access reports failure rather than claiming a copy", async () => {
  saveRecap(recap, adminSource);
  writeText.mockRejectedValueOnce(new Error("Blocked"));
  open(`/saved/${recap.video.id}`);
  await options();
  fireEvent.click(screen.getByRole("button", { name: "Copy reader link" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Could not copy",
  );
  expect(screen.queryByRole("status")).toBeNull();
});

test("a recap without administrator access cannot be shared", async () => {
  saveRecap(recap, source);
  open(`/saved/${recap.video.id}`);
  await options();
  expect(screen.queryByRole("button", { name: "Copy reader link" })).toBeNull();
  expect(
    screen.queryByRole("link", { name: "Open original reader link" }),
  ).toBeNull();
});

test("removal confirms loss of all management access without invalidating links", async () => {
  saveRecap(recap, adminSource);
  open(`/saved/${recap.video.id}`);
  await options();
  fireEvent.click(screen.getByRole("button", { name: "Remove from saved" }));
  expect(readLibrary()).toHaveLength(1);
  fireEvent.click(
    screen.getByRole("button", {
      name: "Remove recap and administrator access",
    }),
  );
  expect(readLibrary()).toEqual([]);
  expect(invalidateLink).not.toHaveBeenCalled();
  expect(await screen.findByText("No saved recaps yet")).toBeTruthy();
});

test("an expired reader link does not recover by link when only the recap was saved", async () => {
  saveRecap(recap, source);
  vi.mocked(loadSharedRecap).mockResolvedValue({
    status: "error",
    reason: "missing",
  });
  open(path);
  await screen.findByText("This link has expired");
  expect(screen.queryByRole("link", { name: "Open saved copy" })).toBeNull();
});

test("an expired managed link can recover its matching local recap", async () => {
  saveRecap(recap, adminSource);
  vi.mocked(loadSharedRecap).mockResolvedValue({
    status: "error",
    reason: "missing",
  });
  open(path);
  expect(
    await screen.findByRole("link", { name: "Open saved copy" }),
  ).toBeTruthy();
});

test("storage changes update the Home C count while preserving the hero", () => {
  open("/");
  expect(screen.queryByRole("link", { name: "View your recaps" })).toBeNull();
  act(() => {
    saveRecap(recap, source);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "commonplace.library.v1" }),
    );
  });
  expect(screen.getByText("1 saved recap")).toBeTruthy();
  expect(screen.getByText("A commonplace book for video.")).toBeTruthy();
  act(() => {
    localStorage.removeItem("commonplace.library.v1");
    window.dispatchEvent(
      new StorageEvent("storage", { key: "commonplace.library.v1" }),
    );
  });
  expect(screen.queryByRole("link", { name: "View your recaps" })).toBeNull();
});

test.each(["corrupt", "blocked"])(
  "%s storage is reported without overwriting it",
  async (mode) => {
    if (mode === "corrupt") {
      localStorage.setItem("commonplace.library.v1", "broken");
    } else {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("Blocked", "SecurityError");
      });
    }
    open(path);
    await options();
    expect(
      screen
        .getByRole("button", { name: "Save in this browser" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(screen.getByRole("alert").textContent).toContain(
      "Existing data has not been changed",
    );
    if (mode === "corrupt") {
      expect(localStorage.getItem("commonplace.library.v1")).toBe("broken");
    }
  },
);

test("invalidating a link does not change local content, credentials or sharing", async () => {
  saveRecap(recap, adminSource);
  const current = {
    ...adminSource,
    url: `/r/BBBBBBBBBBBBBBBBBBBBBB#k=${shareKey}`,
  };
  saveRecap(recap, current);
  const storedBefore = localStorage.getItem("commonplace.library.v1");
  vi.mocked(invalidateLink).mockResolvedValue("invalidated");
  open(`/saved/${recap.video.id}`);
  expect(screen.getAllByRole("button", { name: /Manage link,/ })).toHaveLength(
    1,
  );
  fireEvent.click(screen.getByRole("button", { name: /Manage link,/ }));
  fireEvent.click(screen.getByRole("button", { name: "Invalidate link…" }));
  fireEvent.click(screen.getByRole("button", { name: "Invalidate" }));
  await screen.findByRole("button", { name: /Manage link, link invalidated/ });
  expect(invalidateLink).toHaveBeenCalledWith(
    "BBBBBBBBBBBBBBBBBBBBBB",
    current.management.ownerSecret,
  );
  expect(localStorage.getItem("commonplace.library.v1")).toBe(storedBefore);
  expect(readLibrary()[0].recap).toEqual(recap);
  await options();
  fireEvent.click(screen.getByRole("button", { name: "Copy reader link" }));
  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith(
      new URL(current.url, window.location.origin).href,
    ),
  );
});

test("Escape dismisses the plus menu and restores keyboard focus", async () => {
  open(path);
  const trigger = await options();
  expect(document.activeElement).toBe(
    screen.getByRole("dialog", { name: "Your recaps" }),
  );
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog", { name: "Your recaps" })).toBeNull();
  expect(document.activeElement).toBe(trigger);
  fireEvent.click(trigger);
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("dialog", { name: "Your recaps" })).toBeNull();
});
