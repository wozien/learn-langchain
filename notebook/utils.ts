import { load } from "jsr:@std/dotenv";
import { ChatOpenAI } from "@langchain/openai";

export const env = await load({
  envPath: "../.env",
  export: true,
});

export const newLLM = () => {
  return new ChatOpenAI({
    configuration: {
      baseURL: env["QWEN_BASE_URL"],
      apiKey: env["QWEN_API_KEY"],
    },
    model: env["QWEN_MODEL"],
  });
};
