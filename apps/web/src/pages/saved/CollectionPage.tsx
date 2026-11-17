import { styled } from "@linaria/react";
import { Link } from "react-router-dom";
import { LogoLink } from "../../shared/brand/Logo";
import {
  Card,
  CardBody,
  Cards,
  ErrorNotice,
  Hint,
  LibraryMain,
  LocalNotice,
} from "../../shared/library/Library.styles";
import { LOCAL_STORAGE_NOTICE } from "../../shared/library/storage";
import { useLibrary } from "../../shared/library/useLibrary";
import { ThemeSelect } from "../../shared/ui/ThemeSelect";
import { TopBar } from "../../shared/ui/TopBar";

export function CollectionPage() {
  const { entries, error } = useLibrary();
  return (
    <Page>
      <TopBar>
        <LogoLink />
        <Spacer />
        <ThemeSelect />
      </TopBar>
      <LibraryMain>
        <Link to="/">← Commonplace</Link>
        <h1>
          Your recaps{entries.length ? <Count>{entries.length}</Count> : null}
        </h1>
        <Hint>Your collection, in this browser. In alphabetical order.</Hint>
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
          <Cards>
            {entries.map((entry) => (
              <Card key={entry.recap.video.id}>
                <Link
                  to={`/saved/${entry.recap.video.id}`}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <img
                    src={`https://i.ytimg.com/vi/${encodeURIComponent(entry.recap.video.id)}/hqdefault.jpg`}
                    alt=""
                    loading="lazy"
                  />
                </Link>
                <CardBody>
                  <Hint>
                    {entry.recap.video.channel || "Author unavailable"}
                  </Hint>
                  <Link to={`/saved/${entry.recap.video.id}`}>
                    <h2>{entry.recap.video.title}</h2>
                  </Link>
                  {entry.positionSeconds ? (
                    <Progress>
                      In progress · {formatPosition(entry.positionSeconds)}
                      {entry.recap.video.duration?.seconds
                        ? ` / ${formatPosition(entry.recap.video.duration.seconds)}`
                        : ""}
                    </Progress>
                  ) : null}
                  {entry.management ? (
                    <Access>Administrator access saved</Access>
                  ) : null}
                </CardBody>
              </Card>
            ))}
          </Cards>
        )}
        <LocalNotice>
          <summary>Only in this browser · not synced</summary>
          <p>{LOCAL_STORAGE_NOTICE}</p>
        </LocalNotice>
      </LibraryMain>
    </Page>
  );
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
`;
const Spacer = styled.div`
  flex-grow: 1;
`;
const Count = styled.span`
  margin-left: 12px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 400;
  vertical-align: middle;
`;
const Progress = styled.span`
  color: var(--accent);
  font-size: 12px;
`;
const Access = styled.span`
  color: var(--muted);
  font-size: 11px;
  margin-top: 8px;
`;
function formatPosition(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

const Empty = styled.section`
  margin-top: 32px;
  padding: 32px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  color: var(--muted);
  h2 {
    color: var(--text);
    font-size: 20px;
  }
  p {
    margin: 0;
  }
`;
