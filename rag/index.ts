import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  pathResolve,
  newEmbeddings,
  newLLM,
  convertDocsToString,
} from "@/utils";

async function loadVectorStore() {
  const embeddings = newEmbeddings();
  const vectorStore = await FaissStore.load(pathResolve("db/qiu"), embeddings);
  return vectorStore;
}

async function getRagChain() {
  const vectorStore = await loadVectorStore();
  const retriever = vectorStore.asRetriever(2);

  // 在向量数据库找到和问题相似的文档内容
  const contextRetrieverChain = RunnableSequence.from([
    (input) => input.question,
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

  const prompt = ChatPromptTemplate.fromTemplate(SYSTEM_TEMPLATE);

  const ragChain = RunnableSequence.from([
    {
      context: contextRetrieverChain,
      question: (input) => input.question,
    },
    prompt,
    newLLM(),
    new StringOutputParser(),
  ]);

  return ragChain;
}

async function run() {
  const ragChain = await getRagChain();
  const res = await ragChain.invoke({
    question: "什么是球状闪电？",
  });
  console.log(res);
}

run();
