import { Abstract, Intro, Label, PullQuote } from "./RecapView.styles";

type RecapIntroProps = {
  abstract: string;
  mainTakeaway: string;
  title: string;
};

export function RecapIntro({ abstract, mainTakeaway, title }: RecapIntroProps) {
  return (
    <Intro>
      <h1>{title}</h1>
      <Abstract>{abstract}</Abstract>
      <PullQuote data-size="large">
        <Label>The takeaway</Label>
        <p>{mainTakeaway}</p>
      </PullQuote>
    </Intro>
  );
}
