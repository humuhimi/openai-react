export type Question = {
  question_text: string;
  question_type: "MULTIPLE_CHOICE" | "FREE_RESPONSE";
  choices?: string[];
};
