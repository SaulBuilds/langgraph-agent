import { Annotation, StateGraph } from "@langchain/langgraph";
import {
  bugSeverityHigh,
  bugSeverityLow,
  bugSeverityMedium,
  draftEmail,
  feedbackNegative,
  feedbackPositive,
  processFeedback,
  processMessage,
  processOther,
  processSupport,
  supportBug,
  supportTechnicalQuestion,
} from "./nodes";
import {
  processFeedbackEdges,
  processMessageEdges,
  processSupportBugEdges,
  processSupportEdges,
} from "./edges";

type MessageType =
  | "Feedback" // if positive -> post to slack, if negative -> notify PM
  | "Support" // prepare email for staff
  | "Spam" // ignore
  | "Other"; // send to staff

type SupportType =
  | "Bug" // "Login stopped working" -> define severity, create ticket, alert staff, draft reply
  | "TechnicalQuestion"; // "how to connect with hubspot" -> RAG search helpcenter, draft email, alert staff

type Message = {
  sender: string; // email address
  message: string;
};

type Feedback = {
  userId?: string;
  text: string;
  isPositive: boolean;
};

type Support = {
  userId?: string;
  supportType: SupportType;
  bug?: {
    ticketId: string;
    description: string;
    severity: string;
  };
  technicalQuestion?: {
    question: string;
    answer?: string;
    links: string[];
    answerFound: boolean;
  };
};

const graphAnnotation = Annotation.Root({
  message: Annotation<Message>(),
  messageType: Annotation<MessageType>(),
  support: Annotation<Support>(),
  feedback: Annotation<Feedback>(),
});

export type State = typeof graphAnnotation.State;
export type Update = typeof graphAnnotation.Update;

export function createGraph() {
  const workflow = new StateGraph(graphAnnotation)
    .addNode("process-message", processMessage)
    .addNode("process-feedback", processFeedback)
    .addNode("process-support", processSupport)
    .addNode("process-other", processOther)
    .addNode("support-bug", supportBug)
    .addNode("support-question", supportTechnicalQuestion)
    .addNode("bug-severity-low", bugSeverityLow)
    .addNode("bug-severity-medium", bugSeverityMedium)
    .addNode("bug-severity-high", bugSeverityHigh)
    .addNode("feedback-positive", feedbackPositive)
    .addNode("feedback-negative", feedbackNegative)
    .addNode("draft-email", draftEmail)

    .addEdge("__start__", "process-message")
    .addConditionalEdges("process-message", processMessageEdges)
    .addConditionalEdges("process-feedback", processFeedbackEdges)
    .addConditionalEdges("process-support", processSupportEdges)
    .addConditionalEdges("support-bug", processSupportBugEdges)
    .addEdge("bug-severity-low", "draft-email")
    .addEdge("bug-severity-medium", "draft-email")
    .addEdge("bug-severity-high", "draft-email")
    .addEdge("feedback-negative", "draft-email")
    .addEdge("feedback-positive", "draft-email")
    .addEdge("support-question", "draft-email")
    .addEdge("process-other", "__end__")

    .addEdge("draft-email", "__end__");

  const graph = workflow.compile();

  return graph;
}