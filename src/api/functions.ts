import { QuizArgs, visitorRequestArgs } from "../types";

export function displayQuiz(args: QuizArgs): string[] {
  const title = args["title"];
  const questions = args["questions"];
  console.log("Quiz:", title);
  console.log();
  const responses: string[] = ["Quiz:" + title, ""];

  questions.forEach((q) => {
    console.log(q.question_text);
    let response: string = "";

    // If multiple choice, print options
    if (q.question_type === "MULTIPLE_CHOICE") {
      q.choices?.forEach((choice, i) => {
        console.log(`${i}. ${choice}`);
        responses.push(`${i}. ${choice}`);
      });
      // TODO: need to get from args
      response = getMockResponseFromUserMultipleChoice();
    }
    // Otherwise, just get response
    else if (q.question_type === "FREE_RESPONSE") {
      response = getMockResponseFromUserFreeResponse();
    }

    responses.push(q.question_text, response);
    console.log();
  });

  return responses;
}

// Mock function to simulate user response for multiple choice
function getMockResponseFromUserMultipleChoice(): string {
  // Implement logic to get a mock response
  return "Mock response for multiple choice";
}

// Mock function to simulate user response for free response
function getMockResponseFromUserFreeResponse(): string {
  // Implement logic to get a mock response
  return "Mock response for free response";
}

export const sendSMS = async (subject, message) => {
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
};

export const sendVisitorRequest = (args: visitorRequestArgs): string[] => {
  const visitorEmail = args["visitorEmail"];
  const vistorPurpose = args["vistorPurpose"];
  try {
    fetch("/send-visitor-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ visitorEmail, vistorPurpose }),
    });
  } catch (error) {
    console.error("エラーが発生しました:", error);
    alert("SMS送信中にエラーが発生しました。");
  }
  return [];
};

/**
 * 1.特定のキーワードがユーザーから打たれる 仕事を依頼したいとか
 * 2.そのワードを受け取ってsendVisitorRequestを実行する
 * 3.実行したら特定のメッセージを受け取るよう待機する
 * 4.ユーザーからのメッセージを受け取り次第　その内容を送るメソッドを実行
 */
