// src/components/Chat.tsx
import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Container,
  Grid,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import Message from "./Message";
import SendIcon from "@mui/icons-material/Send";
import {
  createThread,
  retrieveAssistant,
  createNewMessage,
  createMessage,
  getMessageList,
  createRun,
  retrieveRun,
  submitToolOutputs,
} from "../api/openai";
import { MessageDto } from "../models/MessageDto";
import { displayQuiz, sendVisitorRequest } from "../api/functions";
import {
  ActionCallbackType,
  QuizArgs,
  visitorRequestArgs,
} from "../types/index";

const Chat: React.FC = () => {
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<MessageDto>>(
    new Array<MessageDto>()
  );
  const [input, setInput] = useState<string>("");
  const [assistant, setAssistant] = useState<any>(null);
  const [thread, setThread] = useState<any>(null);
  const [functions, setFunctions] =
    useState<ActionCallbackType<QuizArgs | visitorRequestArgs>[]>();
  const [label, setLabel] = useState<string>("Type your message");
  let argList: visitorRequestArgs | QuizArgs = null;
  const [functionArgs, setFunctionArgs] = useState<
    visitorRequestArgs | QuizArgs
  >(null);

  useEffect(() => {
    initChatBot();
  }, []);

  useEffect(() => {
    setMessages([
      {
        content:
          "こんにちは！　僕はふむひみです。何かお手伝いできることはありますか？",
        isUser: false,
      },
    ]);
  }, [assistant]);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const initChatBot = async () => {
    const assistant = await retrieveAssistant();
    const thread = await createThread();
    setAssistant(assistant);
    setThread(thread);
    setFunctions([displayQuiz, sendVisitorRequest]);
  };

  const setArgs = async (toolCall) => {
    console.log(toolCall);
    let args = JSON.parse(toolCall.function.arguments);
    console.log("args");
    if (args) {
      setFunctionArgs(args);
      argList = args;
      console.log(argList);
      setMessage(
        "詳細を下記の形式で書いてください(15秒以内に記入してください)"
      );
      await sleep(5000);
      for (const [key, value] of Object.entries(args)) {
        setIsWaiting(false);
        setMessage(`${key}を入力してください`);
        setLabel(`${key}`);
        await sleep(15000);
        setIsWaiting(true);
      }
    }
    setLabel("Type your message");
  };

  const execAction = async (threadId, run) => {
    try {
      let toolCall = run.required_action.submit_tool_outputs.tool_calls[0];
      let actionCallback = functions.find(
        (actionCallback) => actionCallback.name === toolCall.function.name
      );
      await setArgs(toolCall);
      console.log(actionCallback);
      let functionResponse = await actionCallback(argList);
      console.log(functionResponse);
      setMessage(functionResponse);
      await sleep(5000);
      const toolOutputs = {
        tool_outputs: [
          {
            tool_call_id: toolCall.id,
            output: functionResponse,
          },
        ],
      };
      setFunctionArgs(null);
      return await submitToolOutputs(threadId, run.id, toolOutputs);
    } catch (error) {
      console.error("Error execAction:", error);
      throw error;
    }
  };

  const execRun = async (threadId, run) => {
    setIsWaiting(true);
    while (
      run.status === "in_progress" ||
      run.status === "queued" ||
      run.status === "requires_action"
    ) {
      console.log("waiting...");
      console.log(run.status);

      if (run.status === "requires_action") {
        run = await execAction(threadId, run);
      }
      await sleep(5000);
      run = await retrieveRun(threadId, run.id);
    }
    setIsWaiting(false);
  };

  const handleSendMessage = async () => {
    messages.push(createNewMessage(input, true));
    setMessages([...messages]);
    setInput("");

    // Send a message to the thread
    let message = await createMessage(thread.id, input);
    console.log(message);

    // Run the assistant
    let run = await createRun(thread.id, assistant.id);

    // Create a response
    let response = await retrieveRun(thread.id, run.id);

    // Wait for the response to be ready
    await execRun(thread.id, response);
    const messageList = await getMessageList(thread.id);
    console.log(messageList);

    // Find the last message for the current run
    const lastMessage = messageList.data
      .filter(
        (message: any) =>
          message.run_id === run.id && message.role === "assistant"
      )
      .pop();
    console.log(lastMessage);
    setMessage(lastMessage.content[0]["text"].value);
  };

  const handleSendArgs = async () => {
    console.log("handle send args here:");
    setMessage(input);
    let args = functionArgs;
    if (label in args) {
      args[label] = input;
      setFunctionArgs(args);
      argList = args;
    }
    setInput("");
    setLabel("");
  };

  const setMessage = (message) => {
    if (message) {
      setMessages([...messages, createNewMessage(message, false)]);
    } else {
      console.log("no message input");
    }
  };

  // detect enter key and send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleSend = () => {
    if (functionArgs) {
      handleSendArgs();
    } else {
      handleSendMessage();
    }
  };

  return (
    <Container>
      <Grid container direction="column" spacing={2} paddingBottom={2}>
        {messages.map((message, index) => (
          <Grid
            item
            alignSelf={message.isUser ? "flex-end" : "flex-start"}
            key={"grid-" + index}
          >
            <Message key={index} message={message} />
          </Grid>
        ))}
      </Grid>
      <Grid
        container
        direction="row"
        paddingBottom={5}
        justifyContent={"space-between"}
      >
        <Grid item sm={11} xs={9}>
          <TextField
            label={label}
            variant="outlined"
            disabled={isWaiting}
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          {isWaiting && <LinearProgress color="inherit" />}
        </Grid>
        <Grid item sm={1} xs={3}>
          <Button
            variant="contained"
            size="large"
            color="primary"
            onClick={handleSend}
            disabled={isWaiting}
          >
            {isWaiting && <CircularProgress color="inherit" />}
            {!isWaiting && <SendIcon fontSize="large" />}
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Chat;
