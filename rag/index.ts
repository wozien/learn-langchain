import { FaissStore } from "@langchain/community/vectorstores/faiss";
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableWithMessageHistory,
} from "@langchain/core/runnables";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  pathResolve,
  newEmbeddings,
  newLLM,
  convertDocsToString,
} from "@/utils";
import { JSONChatHistory } from "@/utils/JSONChatHistory";

async function loadVectorStore() {
  const embeddings = newEmbeddings();
  const vectorStore = await FaissStore.load(pathResolve("db/qiu"), embeddings);
  return vectorStore;
}

// 对用户问题进行优化，增强retriever结果质量
async function getRephraseChain() {
  const rephraseChainPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "给定以下对话和一个后续问题，请将后续问题重述为一个独立的问题。请注意，重述的问题应该包含足够的信息，使得没有看过对话历史的人也能理解。",
    ],
    new MessagesPlaceholder("history"),
    ["human", "将以下问题重述为一个独立的问题：\n{question}"],
  ]);

  const rephraseChain = RunnableSequence.from([
    rephraseChainPrompt,
    newLLM(),
    new StringOutputParser(),
  ]);
  return rephraseChain;
}

export async function getRagChain() {
  const vectorStore = await loadVectorStore();
  const retriever = vectorStore.asRetriever(2);

  // 在向量数据库找到和问题相似的文档内容
  const contextRetrieverChain = RunnableSequence.from([
    (input) => input.standalone_question,
    retriever,
    convertDocsToString,
  ]);

  const SYSTEM_TEMPLATE = `
    你是一个熟读刘慈欣的《球状闪电》的终极原着党，精通根据作品原文详细解释和回答问题，你在回答时会引用作品原文。
    并且回答时仅根据原文，尽可能回答用户问题，如果原文中没有相关内容，你可以回答“原文中没有相关内容”，

    以下是原文中跟用户回答相关的内容：
    {context}

    现在，你需要基于原文，回答以下问题：
    {question}
  `;

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_TEMPLATE],
    new MessagesPlaceholder("history"),
    ["human", "现在，你需要基于原文，回答以下问题：\n{standalone_question}`"],
  ]);
  const chatModel = newLLM();
  const rephraseChain = await getRephraseChain();

  const ragChain = RunnableSequence.from([
    RunnablePassthrough.assign({
      standalone_question: rephraseChain,
    }),
    RunnablePassthrough.assign({
      context: contextRetrieverChain,
    }),
    prompt,
    chatModel,
    new StringOutputParser(),
  ]);

  const chatHistoryDir = pathResolve("chat-data");

  const ragChainWithHistory = new RunnableWithMessageHistory({
    runnable: ragChain,
    getMessageHistory: (sessionId) =>
      new JSONChatHistory({ sessionId, dir: chatHistoryDir }),
    historyMessagesKey: "history",
    inputMessagesKey: "question",
  });

  return ragChainWithHistory;
}

async function run() {
  const ragChain = await getRagChain();
  const res = await ragChain.invoke(
    {
      question: "什么是球状闪电？",
    },
    {
      configurable: {
        sessionId: "ask-qiu-history",
      },
    }
  );
  console.log(res);
}

// run();
