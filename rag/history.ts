import { JSONChatHistory } from "@/utils/JSONChatHistory";
import { pathResolve } from "@/utils";
import { HumanMessage } from "@langchain/core/messages";

const history = new JSONChatHistory({
  dir: pathResolve("chat-data"),
  sessionId: "test",
});

async function run() {
  await history.addMessages([new HumanMessage("hello")]);
}

run();
