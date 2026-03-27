export interface DemoSample {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  triangleText: string;
  question: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "mature-motor",
    label: "Mature motor",
    description: "Well-developed motor triangle with stronger confidence and adequate reserve posture.",
    sourceLabel: "mature-motor-triangle.csv",
    triangleText: `AY,12,24,36,48,60\n2019,1200,2150,2580,2720,2780\n2020,1350,2400,2890,3050,3115\n2021,1100,1980,2410,2595,2660\n2022,1280,2280,2760,2950\n2023,1150,2050,2480\n2024,990,1790\n2025,830`,
    question: "Which accident year carries most remaining IBNR and why?"
  },
  {
    id: "long-tail-casualty",
    label: "Long-tail casualty",
    description: "Immature casualty profile with explicit tail factor and strengthening requirement.",
    sourceLabel: "long-tail-casualty.csv",
    triangleText: `tail_factor=1.08\nAY,12,24,36,48,60\n2019,900,1700,2490,3270,3890\n2020,980,1840,2710,3510,4210\n2021,1100,2050,2990,3860\n2022,1260,2370,3450\n2023,1420,2660\n2024,1590`,
    question: "How much uplift comes from tail assumptions and immature years?"
  },
  {
    id: "sparse-mixed",
    label: "Sparse mixed",
    description: "Sparse dataset with nulls to trigger cautionary warnings and lower confidence.",
    sourceLabel: "sparse-mixed-triangle.csv",
    triangleText: `AY,12,24,36,48\n2020,640,1150,1540,1860\n2021,710,1260,1670\n2022,780,1390\n2023,850,-\n2024,920`,
    question: "What data quality warnings should be escalated before sign-off?"
  }
];
