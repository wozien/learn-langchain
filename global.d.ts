declare namespace NodeJS {
  interface ProcessEnv {
    QWEN_BASE_URL: string;
    QWEN_API_KEY: string;
    QWEN_MODEL: string;
    QWEN_EMBEDDINGS_MODEL: string;
  }
}
