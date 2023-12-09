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
import OpenAI from "openai";
import { MessageDto } from "../models/MessageDto";
import SendIcon from "@mui/icons-material/Send";

type Question = {
  question_text: string;
  question_type: string;
  choices?: string[];
};

const Chat: React.FC = () => {
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<MessageDto>>(
    new Array<MessageDto>()
  );
  const [input, setInput] = useState<string>("");
  const [assistant, setAssistant] = useState<any>(null);
  const [thread, setThread] = useState<any>(null);
  const [run, setRun] = useState<any>(null);
  const [openai, setOpenai] = useState<any>(null);

  useEffect(() => {
    initChatBot();
  }, []);

  useEffect(() => {
    setMessages([
      {
        content: "Hi, I'm your personal assistant. How can I help you?",
        isUser: false,
      },
    ]);
  }, [assistant]);

  async function sendSMS(subject, message) {
    try {
      const response = await fetch("/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subject, message }),
      });

      if (response.ok) {
        const responseBody = await response.text();
        console.log(responseBody);
        alert("SMS送信に成功しました！");
      } else {
        alert("SMS送信に失敗しました。");
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      alert("SMS送信中にエラーが発生しました。");
    }
  }

  // example function
  const displayQuiz = (title: string, questions: Question[]): string[] => {
    // メール送信自動化
    console.log("メール送信自動化");
    console.log(
      sendSMS("自動送信テスト", "hello from assistant api function calling.")
    );
    setMessages([...messages, createNewMessage("Quiz:" + title, false)]);
    const responses: string[] = [];

    questions.forEach((q) => {
      console.log(q.question_text);
      setMessages([...messages, createNewMessage(q.question_text, false)]);
      let response = "";

      if (q.question_type === "MULTIPLE_CHOICE") {
        q.choices?.forEach((choice, i) => {
          setMessages([
            ...messages,
            createNewMessage(`${i}. ${choice}`, false),
          ]);
        });
        // get_mock_response_from_user_multiple_choice
        response = "a";
      } else if (q.question_type === "FREE_RESPONSE") {
        // get_mock_response_from_user_free_response
        response = "I don't know.";
      }

      responses.push(response);
    });
    return responses;
  };

  const initChatBot = async () => {
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    // Retrieve an assistant
    const assistant = await openai.beta.assistants.retrieve(
      process.env.REACT_APP_OPENAI_ASSISTANT_ID
    );
    // Create a thread
    const thread = await openai.beta.threads.create();
    // console.log(thread);

    setOpenai(openai);
    setAssistant(assistant);
    setThread(thread);
  };

  const createNewMessage = (content: string, isUser: boolean) => {
    const newMessage = new MessageDto(isUser, content);
    return newMessage;
  };

  const waitOnRun = async (response) => {
    while (response.status === "in_progress" || response.status === "queued") {
      console.log(response.status);
      console.log("waiting...");
      setIsWaiting(true);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      response = await openai.beta.threads.runs.retrieve(
        thread.id,
        response.id
      );
      setRun(response);
    }
    return response;
  };

  const handleSendMessage = async () => {
    messages.push(createNewMessage(input, true));
    setMessages([...messages]);
    setInput("");

    // Send a message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: input,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });
    setRun(run);

    // Create a response
    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    setRun(response);

    // Wait for the response to be ready
    response = await waitOnRun(response);
    setRun(response);

    console.log(response.status);
    if (response.status === "requires_action") {
      setIsWaiting(false);
      let toolCall = response.required_action.submit_tool_outputs.tool_calls[0];
      console.warn(toolCall);
      // let name = toolCall.function.name;
      let args = JSON.parse(toolCall.function.arguments);
      let functionResponse = displayQuiz(args["title"], args["questions"]);
      // console.dir(response);

      const functionalRun = await openai.beta.threads.runs.submitToolOutputs(
        thread.id,
        response.id,
        {
          tool_outputs: [
            {
              tool_call_id: toolCall.id,
              output: JSON.stringify(functionResponse),
            },
          ],
        }
      );
      setRun(functionalRun);
      setIsWaiting(true);
    }
    let lastRun = waitOnRun(run);
    setRun(lastRun);
    // console.log(lastRun);
    setIsWaiting(false);

    // setIsWaiting(false);

    // Get the messages for the thread
    const messageList = await openai.beta.threads.messages.list(thread.id);
    console.log(messageList);

    // Find the last message for the current run
    const lastMessage = messageList.data
      .filter(
        (message: any) =>
          message.run_id === run.id && message.role === "assistant"
      )
      .pop();
    console.log(lastMessage);

    // Print the last message coming from the assistant
    if (lastMessage) {
      console.log(lastMessage.content[0]["text"].value);
      setMessages([
        ...messages,
        createNewMessage(lastMessage.content[0]["text"].value, false),
      ]);
    }
  };

  // detect enter key and send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
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
            label="Type your message"
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
            onClick={handleSendMessage}
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
