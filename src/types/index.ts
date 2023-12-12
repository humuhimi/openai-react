export type QuizArgs = {
  title: string;
  questions: string;
};

export type visitorRequestArgs = {
  email: string;
  purpose: string;
};

export type ActionCallbackType<T> = (args: T) => Promise<string>;

export type ToolOutputResponse = {
  tool_outputs: ToolOutput[];
};

type ToolOutput = {
  tool_call_id: string;
  output: string;
};
