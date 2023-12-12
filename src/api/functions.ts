import { QuizArgs, visitorRequestArgs } from "../types";

/**
 * example
 *
 * (
 *   "Sample Quiz",
 *   [
 *        {"question_text": "What is your name?", "question_type": "FREE_RESPONSE"},
 *       {
 * "question_text": "What is your favorite color?",
 *           "question_type": "MULTIPLE_CHOICE",
 *           "choices": ["Red", "Blue", "Green", "Yellow"],
 *       },
 *   ],
 * )
 */
export async function displayQuiz(args: QuizArgs): Promise<string> {
  console.log(args);
  const title = args["title"];
  const questions = [
    { question_text: "What is your name?", question_type: "FREE_RESPONSE" },
    {
      question_text: "What is your favorite color?",
      question_type: "MULTIPLE_CHOICE",
      choices: ["Red", "Blue", "Green", "Yellow"],
    },
  ];

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
      response = getMockResponseFromUserMultipleChoice();
    }
    // Otherwise, just get response
    else if (q.question_type === "FREE_RESPONSE") {
      response = getMockResponseFromUserFreeResponse();
    }

    responses.push(q.question_text, response);
    console.log();
  });

  return JSON.stringify(responses);
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

export const sendVisitorRequest = async (
  args: visitorRequestArgs
): Promise<string> => {
  console.log(args);
  const email = args["email"];
  const purpose = args["purpose"];
  const message = `
  入力ありがとうございます\n
  下記の内容でメールを送らせてもらいました\n
  訪問者のメールアドレス: ${email}\n
  訪問者の目的: ${purpose}\n
  もし急ぎの場合は当サイトの連絡先のページから直接ご連絡ください\n
  `;
  try {
    const response = await fetch("/send-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, purpose }),
    });

    if (response.ok) {
      const responseBody = await response.text();
      console.log(responseBody);
      alert("SMS送信に成功しました！");
    } else {
      alert("SMS送信に失敗しました。");
    }
    return message;
  } catch (error) {
    console.error("エラーが発生しました:", error);
    alert("SMS送信中にエラーが発生しました。");
  }
};
