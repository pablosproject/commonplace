import { styled } from "@linaria/react";
import { Link, useSearchParams } from "react-router-dom";
import { LogoLink } from "../../shared/brand/Logo";
import { ErrorNotice } from "../../shared/library/Library.styles";
import { LOCAL_STORAGE_NOTICE } from "../../shared/library/storage";
import { useLibrary } from "../../shared/library/useLibrary";
import { ThemeSelect } from "../../shared/ui/ThemeSelect";
import { TopBar } from "../../shared/ui/TopBar";
import {
  Count,
  Empty,
  Entries,
  Entry,
  EntryText,
  Heading,
  LibraryMain,
  LocalNotice,
  Meta,
  Progress,
  Takeaway,
  Thumbnail,
  ViewButton,
  ViewSwitch,
} from "./CollectionPage.styles";

export function CollectionPage() {
  const { entries, error } = useLibrary();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "grid" ? "grid" : "list";

  return (
    <Page>
      <TopBar>
        <LogoLink />
        <Spacer />
        <ThemeSelect />
      </TopBar>
      <LibraryMain data-view={view}>
        <Heading>
          <h1>
            Your recaps{entries.length ? <Count>{entries.length}</Count> : null}
          </h1>
          <ViewSwitch role="group" aria-label="View">
            <ViewButton
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setSearchParams({}, { replace: true })}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </ViewButton>
            <ViewButton
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() =>
                setSearchParams({ view: "grid" }, { replace: true })
              }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
                <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
                <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
                <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
              </svg>
            </ViewButton>
          </ViewSwitch>
        </Heading>
        {error ? (
          <ErrorNotice role="alert">{error}</ErrorNotice>
        ) : !entries.length ? (
          <Empty>
            <h2>No saved recaps yet</h2>
            <p>
              Open a recap and use the + in its header to save a copy in this
              browser.
            </p>
          </Empty>
        ) : (
          <Entries>
            {entries.map(({ recap, positionSeconds }) => {
              const href = `/saved/${recap.video.id}`;
              const duration = recap.video.duration?.seconds;
              return (
                <Entry key={recap.video.id}>
                  <Thumbnail>
                    <Link to={href} tabIndex={-1} aria-hidden="true">
                      <img
                        src={`https://i.ytimg.com/vi/${encodeURIComponent(recap.video.id)}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                      />
                    </Link>
                    {positionSeconds && duration ? (
                      <Progress
                        role="progressbar"
                        aria-label="Watched"
                        aria-valuemin={0}
                        aria-valuemax={duration}
                        aria-valuenow={Math.min(positionSeconds, duration)}
                        aria-valuetext={`${formatTime(positionSeconds)} of ${formatTime(duration)}`}
                      >
                        <span
                          style={{
                            width: `${Math.min(100, (positionSeconds / duration) * 100)}%`,
                          }}
                        />
                      </Progress>
                    ) : null}
                  </Thumbnail>
                  <EntryText>
                    <Link to={href}>
                      <h2>{recap.video.title}</h2>
                    </Link>
                    {view === "list" ? (
                      <Takeaway>{recap.mainTakeaway}</Takeaway>
                    ) : null}
                    <Meta>
                      <span>{recap.video.channel || "Author unavailable"}</span>
                      {duration ? <span>{formatTime(duration)}</span> : null}
                    </Meta>
                  </EntryText>
                </Entry>
              );
            })}
          </Entries>
        )}
        <LocalNotice>
          <summary>Only in this browser · not synced</summary>
          <p>{LOCAL_STORAGE_NOTICE}</p>
        </LocalNotice>
      </LibraryMain>
    </Page>
  );
}

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, "0");
  if (hours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`;
  }

  return `${minutes}:${seconds}`;
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
`;
const Spacer = styled.div`
  flex-grow: 1;
`;
