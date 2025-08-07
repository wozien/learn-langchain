/**
 * 构建 dataset/qiu.txt 数据集向量数据库
 */

import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { pathResolve, newEmbeddings } from "@/utils";

const run = async () => {
  const loader = new TextLoader(pathResolve("dataset/qiu.txt"));
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = newEmbeddings();

  // 千问每次只支持10个数据的批量向量化
  // const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

  // 创建向量数据库实例并持久化
  const vectorStore = new FaissStore(embeddings, {});
  for (let i = 0; i < splitDocs.length; i += 10) {
    await vectorStore.addDocuments(splitDocs.slice(i, i + 10));
  }

  await vectorStore.save(pathResolve("db/qiu"));
};

run();
