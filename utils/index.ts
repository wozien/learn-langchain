import * as path from "path";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import "dotenv/config";

export const pathResolve = (dirPath: string) => {
  return path.join(process.cwd(), dirPath);
};

export const newEmbeddings = () => {
  return new OpenAIEmbeddings({
    configuration: {
      baseURL: process.env["QWEN_BASE_URL"],
      apiKey: process.env["QWEN_API_KEY"],
    },
    model: process.env["QWEN_EMBEDDINGS_MODEL"],
  });
};

export const newLLM = () => {
  return new ChatOpenAI({
    configuration: {
      baseURL: process.env["QWEN_BASE_URL"],
      apiKey: process.env["QWEN_API_KEY"],
    },
    model: process.env["QWEN_MODEL"],
  });
};

export const convertDocsToString = (docs: Document[]): string => {
  return docs.map((doc) => doc.pageContent).join("\n");
};
