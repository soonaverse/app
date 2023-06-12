export const TOKEN_METRICS_INITIAL_COLORS = ['#F39200', '#008AF2', '#7863CB', '#EA849D', '#7CD4AA'];

export const getRandomColor = (): string => `#${(((1 << 24) * Math.random()) | 0).toString(16)}`;
export const getProposalDoughnutColors = (answersCount: number): string[] => {
  const START_COLOR = { R: 0xc2, G: 0x74, B: 0x00 };
  const END_COLOR = { R: 0xff, G: 0xe0, B: 0xb3 };
  return new Array(answersCount)
    .fill('')
    .map((_, index) => ({
      R: START_COLOR.R + ((END_COLOR.R - START_COLOR.R) * index) / Math.max(answersCount - 1, 1),
      G: START_COLOR.G + ((END_COLOR.G - START_COLOR.G) * index) / Math.max(answersCount - 1, 1),
      B: START_COLOR.B + ((END_COLOR.B - START_COLOR.B) * index) / Math.max(answersCount - 1, 1),
    }))
    .map(
      ({ R, G, B }) =>
        `#${('0' + Math.round(R).toString(16)).slice(-2)}${('0' + Math.round(G).toString(16)).slice(
          -2,
        )}${('0' + Math.round(B).toString(16)).slice(-2)}`,
    );
};
