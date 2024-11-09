import { ChatOpenAI } from "@langchain/openai";
import { State, Update } from "./graph";
import { z } from "zod";
import { getUserFromEmail } from "./utils";
import { emailService } from ".";

export const processMessage = async (state: State): Promise<Update> => {
  const llm = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o-mini",
  });

  const structuredLlm = llm.withStructuredOutput(
    z.object({
      type: z
        .enum(["Support", "Feedback", "Spam", "Other"])
        .describe(
          "The type of the email it can be either 'Support', 'Feedback', 'Spam' or 'Other'"
        ),
      reason: z.string().describe("The reason why you selected the type"),
    })
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert email-analizer AI. 
      You are given emails and you give them one of the avaliable labels.
      You answer with a json of this structure: {
        type: 'Support' | 'Feedback' | 'Spam' | 'Other',
        reason: string
      }`,
    ],
    ["human", state.message.message],
  ]);

  console.log("Process Message Result", res);

  return {
    messageType: res.type,
  };
};

export const processFeedback = async (state: State): Promise<Update> => {
  const userId = getUserFromEmail(state.message.sender);

  const llm = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o-mini",
  });

  const structuredLlm = llm.withStructuredOutput(
    z.object({
      isPositive: z.boolean().describe("If the feedback was positive or not"),
      reason: z
        .string()
        .describe("The reason for your selection of 'isPositive'"),
    })
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert sentiment analysis AI.
      You process feedback a company received and have to decide if it was positive or negative.
      You answer with a json of this structure: {
        isPositive: boolean,
        reason: string
      }`,
    ],
    ["human", state.message.message],
  ]);

  console.log("Process Feedback Result", res);

  return {
    feedback: {
      isPositive: res.isPositive,
      userId: userId,
      text: state.message.message,
    },
  };
};

export const processSupport = async (state: State): Promise<Update> => {
  const userId = getUserFromEmail(state.message.sender);

  const llm = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o-mini",
  });

  const structuredLlm = llm.withStructuredOutput(
    z.object({
      type: z
        .enum(["Bug", "TechnicalQuestion"])
        .describe("If the support request is a bug or technical question"),
      reason: z.string().describe("The reason for your selection of the type"),
    })
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert support request analizer AI. 
      You are given a support request and you give them one of the avaliable labels.
      You answer with a json of this structure: {
        type: 'Bug' | 'TechnicalQuestion',
        reason: string
      }`,
    ],
    ["human", state.message.message],
  ]);

  console.log("Process Support Result", res);

  return {
    support: {
      userId: userId,
      supportType: res.type,
    },
  };
};

export const processOther = async (state: State): Promise<Update> => {
  console.log("Process Other: Send email to support staff", state.message);
  return {};
};

export const supportBug = async (state: State): Promise<Update> => {
  const llm = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o-mini",
  });

  const structuredLlm = llm.withStructuredOutput(
    z.object({
      severity: z
        .enum(["high", "medium", "low"])
        .describe("The severity of the bug"),
      description: z.string().describe("A detailed description of the bug"),
      reason: z.string().describe("The reason for your selection of severity"),
    })
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert bug report handler AI. 
      You are given a bug report and decide a severity level and create a detailed description for the support staff.
      You answer with a json of this structure: {
        severity: "high" | "medium" | "low",
        description: string
        reason: string
      }`,
    ],
    ["human", state.message.message],
  ]);

  console.log("Process Bug Result", res);
  return {
    support: {
      ...state.support,
      bug: {
        ticketId: `BUG-${Date.now()}`, // Generate a unique ticket ID
        description: res.description,
        severity: res.severity,
      },
    },
  };
};

export const supportTechnicalQuestion = async (
  state: State
): Promise<Update> => {
  const helpcenterResponse = [
    {
      article:
        "We support these 3rd party apps: Hubspot, Notion, Salesforce and Slack",
      link: "https://saas.helpcenter/get-started",
    },
    {
      article:
        "To connect 3rd party apps got to the settings page, find the tab of the app you want to connect to and paste the api key",
      link: "https://saas.helpcenter/connect-3rd-party-apps",
    },
  ];

  const llm = new ChatOpenAI({
    temperature: 0,
    model: "gpt-4o-mini",
  });

  const structuredLlm = llm.withStructuredOutput(
    z.object({
      answer: z.string().describe("A answer based on the provided documents"),
      answerFound: z
        .boolean()
        .describe("If an answer was found in the documents"),
      reason: z
        .string()
        .describe(
          "The reason for your selection of 'answer' and 'answerFound'"
        ),
    })
  );

  const res = await structuredLlm.invoke([
    [
      "system",
      `You are an expert Support AI. 
      You are given a questoin from the user and the search result from the help center.
      Answer the users question using results form the helpcenter, if theres nothing useful in the results set answeresFound false.
       You answer with a json of this structure: {
        answer: string,
        answerFound: boolean
        reason: string
      }
      `,
    ],
    [
      "user",
      `# QUESTION: 
        ${state.message.message}  

      # HELPCENTER SEARCH RESULT
        ${helpcenterResponse.map((it) => it.article).join("\n")}
      `,
    ],
  ]);

  console.log("SUpport Tech Question Result", res);

  return {
    support: {
      ...state.support,
      technicalQuestion: {
        question: state.message.message,
        answer: res.answer,
        links: helpcenterResponse.map((it) => it.link),
        answerFound: res.answerFound,
      },
    },
  };
};

export const bugSeverityLow = async (state: State): Promise<Update> => {
  // todo create a new ticket
  console.log(
    "Creating a new ticket, Severity low",
    state.support.bug?.description
  );
  return {};
};

export const bugSeverityMedium = async (state: State): Promise<Update> => {
  // todo create a new ticket & send slack channel
  console.log(
    "Creating a new ticket, Severity medium",
    state.support.bug?.description
  );
  console.log("Send notification about ticket in the developer channel");
  return {};
};
export const bugSeverityHigh = async (state: State): Promise<Update> => {
  // todo create a new ticket & send message to staff on support duty
  console.log(
    "Creating a new ticket, Severity high",
    state.support.bug?.description
  );
  console.log(
    "Searching for staff on support duty and send notifcation via slack"
  );
  return {};
};

export const feedbackPositive = async (state: State): Promise<Update> => {
  console.log("Send feedback to feedback slack channel");
  return {};
};

export const feedbackNegative = async (state: State): Promise<Update> => {
  console.log("Send feedback to feedback slack channel");
  console.log("Notifiy PM about negaitve feedback");
  return {};
};

export const draftEmail = async (state: State): Promise<Update> => {
  let subject = '';
  let body = '';

  if (state.messageType === "Feedback" && state.feedback.isPositive) {
    subject = "Thank you for your feedback!";
    body = "Thank you so much for your positive feedback! ❤️";
  }

  if (state.messageType === "Feedback" && !state.feedback.isPositive) {
    subject = "We received your feedback";
    body = "Thank you for your feedback. We take all feedback seriously and will look into your concerns right away.";
  }

  if (state.messageType === "Support" && state.support.bug) {
    const ticketId = state.support.bug.ticketId;
    subject = `Bug Report: Ticket #${ticketId}`;
    body = `We've received your bug report and our team is actively working on it. We'll keep you updated on the progress.`;
  }

  if (state.messageType === "Support" && state.support.technicalQuestion) {
    subject = "RE: Technical Support";
    if (state.support.technicalQuestion.answerFound) {
      body = `${state.support.technicalQuestion.answer}\n\nHelpful resources:\n${state.support.technicalQuestion.links.join("\n")}`;
    } else {
      body = "We've received your technical question and our support team will reach out to you shortly with a detailed response.";
    }
  }

  try {
    await emailService.sendEmail(state.message.sender, subject, body);
    console.log('Email sent successfully to:', state.message.sender);
  } catch (error) {
    console.error('Failed to send email:', error);
    // Optionally, you could implement a retry mechanism or fallback here
  }

  return {};
};