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
  waitOnRun,
} from "../api/openai";
import { MessageDto } from "../models/MessageDto";

const Chat: React.FC = () => {
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<MessageDto>>(
    new Array<MessageDto>()
  );
  const [input, setInput] = useState<string>("");
  const [assistant, setAssistant] = useState<any>(null);
  const [thread, setThread] = useState<any>(null);

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

  // example functio

  const initChatBot = async () => {
    const assistant = await retrieveAssistant();
    const thread = await createThread();
    setAssistant(assistant);
    setThread(thread);
  };

  const execRun = async (threadId, run) => {
    setIsWaiting(true);
    const response = await waitOnRun(threadId, run);
    setIsWaiting(false);
    return response;
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
