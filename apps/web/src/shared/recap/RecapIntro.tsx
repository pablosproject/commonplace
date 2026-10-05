import { Abstract, Intro, Label, Meta, PullQuote } from "./RecapView.styles";

type RecapIntroProps = {
  abstract: string;
  mainTakeaway: string;
  meta: string;
  title: string;
};

export function RecapIntro({
  abstract,
  mainTakeaway,
  meta,
  title,
}: RecapIntroProps) {
  return (
    <Intro>
      {meta ? <Meta>{meta}</Meta> : null}
      <h1>{title}</h1>
      <Abstract>{abstract}</Abstract>
      <PullQuote data-size="large">
        <Label>The takeaway</Label>
        <p>{mainTakeaway}</p>
      </PullQuote>
    </Intro>
  );
}
