import { OpenAI } from "openai";
import { MessageDto } from "../models/MessageDto";
import { Run } from "openai/src/resources/beta/threads/runs/runs";
import { ActionCallbacksType } from "../types";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const retrieveAssistant = async () => {
  try {
    // アシスタントを取得
    const assistant = await openai.beta.assistants.retrieve(
      process.env.REACT_APP_OPENAI_ASSISTANT_ID
    );
    return assistant;
  } catch (error) {
    // エラーが発生した場合の処理
    console.error("Error retrieving assistant:", error);
    throw error; // エラーをスローして呼び出し元で対処できるようにする
  }
};

export const createThread = async () => {
  try {
    // スレッドを作成
    const thread = await openai.beta.threads.create();
    return thread;
  } catch (error) {
    // エラーが発生した場合の処理
    console.error("Error creating thread:", error);
    throw error; // エラーをスローして呼び出し元で対処できるようにする
  }
};

export const createNewMessage = (content: string, isUser: boolean) => {
  try {
    const newMessage = new MessageDto(isUser, content);
    return newMessage;
  } catch (error) {
    console.error("Error creating new message:", error);
    throw error;
  }
};

export const createMessage = async (threadId, input) => {
  try {
    const message = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: input,
    });
    return message;
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
};

export const getMessageList = async (threadId) => {
  try {
    const messageList = await openai.beta.threads.messages.list(threadId);
    return messageList;
  } catch (error) {
    console.error("Error getting message list:", error);
    throw error;
  }
};

export const createRun = async (threadId, assistantId) => {
  try {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });
    return run;
  } catch (error) {
    console.error("Error creating run:", error);
    throw error;
  }
};

export const retrieveRun = async (threadId, runId) => {
  try {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);
    return run;
  } catch (error) {
    console.error("Error retrieving run:", error);
    throw error;
  }
};

export const waitOnRun = async (
  threadId,
  run: Run,
  actionCallbacks: ActionCallbacksType[]
) => {
  try {
    while (
      run.status === "in_progress" ||
      run.status === "queued" ||
      run.status === "requires_action"
    ) {
      console.log("waiting...");
      console.log(run.status);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      if (run.status === "requires_action") {
        let functionName =
          run.required_action.submit_tool_outputs.tool_calls[0].function.name;
        let actionCallback = actionCallbacks.find(
          (actionCallback) => actionCallback.name === functionName
        );

        run = await execRunACtion(threadId, run, actionCallback);
      }
      run = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }
  } catch (error) {
    console.error("Error in waitOnRun:", error);
    throw error; // エラーをスローして呼び出し元で対処できるようにする
  }
  return run;
};

const execRunACtion = async (
  threadId,
  run: Run,
  actionCallback: ActionCallbacksType
): Promise<Run> => {
  try {
    let toolCall = run.required_action.submit_tool_outputs.tool_calls[0];
    console.log(toolCall);

    let args = JSON.parse(toolCall.function.arguments);
    console.log("args");
    console.log(args);

    let functionResponse = actionCallback(args);

    const functionalRun = await openai.beta.threads.runs.submitToolOutputs(
      threadId,
      run.id,
      {
        tool_outputs: [
          {
            tool_call_id: toolCall.id,
            output: JSON.stringify(functionResponse),
          },
        ],
      }
    );
    console.log(functionalRun);
    return functionalRun;
  } catch (error) {
    console.error("エラーが発生しました:", error);
    // ここにエラー処理のロジックを追加する
    throw error; // エラーを再投げるか、適切なエラー処理を行う
  }
};
