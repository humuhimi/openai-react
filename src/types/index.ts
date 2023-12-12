export type QuizArgs = {
  title: string;
  questions: Question[];
};

export type visitorRequestArgs = {
  visitorEmail: string;
  vistorPurpose: string;
};

type ActionCallbackType<T> = (args: T) => Array<string>;

export type ActionCallbacksType =
  | ActionCallbackType<QuizArgs>
  | ActionCallbackType<visitorRequestArgs>;

type Question = {
  question_text: string;
  question_type: QuestionType;
  choices?: string[];
};

type QuestionType = "MULTIPLE_CHOICE" | "FREE_RESPONSE";
