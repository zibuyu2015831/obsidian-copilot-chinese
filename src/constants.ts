import { CustomModel } from "@/aiParams";
import { CopilotSettings } from "@/settings/SettingsPage";

export const CHAT_VIEWTYPE = "copilot-chat-view";
export const USER_SENDER = "【User】";
export const AI_SENDER = "【AI】";
export const DEFAULT_SYSTEM_PROMPT =
  "You are Obsidian Copilot, a helpful assistant that integrates AI to Obsidian note-taking.";

export enum ChatModels {
  GPT_4o = "gpt-4o",
  GPT_4o_mini = "gpt-4o-mini",
  GPT_4_TURBO = "gpt-4-turbo",
  GEMINI_PRO = "gemini-1.5-pro",
  GEMINI_FLASH = "gemini-1.5-flash",
  AZURE_OPENAI = "azure-openai",
  CLAUDE_3_5_SONNET = "claude-3-5-sonnet-20240620",
  CLAUDE_3_HAIKU = "claude-3-haiku-20240307",
  COMMAND_R = "command-r",
  COMMAND_R_PLUS = "command-r-plus",
}

// Model Providers
export enum ChatModelProviders {
  OPENAI = "openai",
  AZURE_OPENAI = "azure openai",
  ANTHROPIC = "anthropic",
  COHEREAI = "cohereai",
  GOOGLE = "google",
  OPENROUTERAI = "openrouterai",
  GROQ = "groq",
  OLLAMA = "ollama",
  LM_STUDIO = "lm-studio",
  OPENAI_FORMAT = "3rd party (openai-format)",
}

export const BUILTIN_CHAT_MODELS: CustomModel[] = [
  // 注意：这里必须要开启一个，开启一个不常用的，免得和自定义的混淆
  // {
  //   name: ChatModels.GPT_4o,
  //   provider: ChatModelProviders.OPENAI,
  //   enabled: true,
  //   isBuiltIn: true,
  // },
  // {
  //   name: ChatModels.GPT_4o_mini,
  //   provider: ChatModelProviders.OPENAI,
  //   enabled: true,
  //   isBuiltIn: true,
  // },
  // {
  //   name: ChatModels.GPT_4_TURBO,
  //   provider: ChatModelProviders.OPENAI,
  //   enabled: true,
  //   isBuiltIn: true,
  // },
  // {
  //   name: ChatModels.CLAUDE_3_5_SONNET,
  //   provider: ChatModelProviders.ANTHROPIC,
  //   enabled: true,
  //   isBuiltIn: true,
  // },
  // {
  //   name: ChatModels.CLAUDE_3_HAIKU,
  //   provider: ChatModelProviders.ANTHROPIC,
  //   enabled: true,
  //   isBuiltIn: true,
  // },
  // {
  //   name: ChatModels.COMMAND_R,
  //   provider: ChatModelProviders.COHEREAI,
  //   enabled: true,
  //   isBuiltIn: true,
  // },
  {
    name: ChatModels.COMMAND_R_PLUS,
    provider: ChatModelProviders.COHEREAI,
    enabled: true,
    isBuiltIn: true,
  },
  // {
  //   name: ChatModels.GEMINI_PRO,
  //   provider: ChatModelProviders.GOOGLE,
  //   enabled: true,
  //   isBuiltIn: true,
  // },
  // {
  //   name: ChatModels.GEMINI_FLASH,
  //   provider: ChatModelProviders.GOOGLE,
  //   enabled: true,
  //   isBuiltIn: true,
  // },
  // {
  //   name: ChatModels.AZURE_OPENAI,
  //   provider: ChatModelProviders.AZURE_OPENAI,
  //   enabled: true,
  //   isBuiltIn: true,
  // },
];

export enum EmbeddingModelProviders {
  OPENAI = "openai",
  COHEREAI = "cohereai",
  AZURE_OPENAI = "azure_openai",
  OLLAMA = "ollama",
  OPENAI_FORMAT = "3rd party (openai-format)",
  // HUGGINGFACE = "huggingface",
  // VOYAGEAI = "voyageai",
}

export enum EmbeddingModels {
  OPENAI_EMBEDDING_ADA_V2 = "text-embedding-ada-002",
  OPENAI_EMBEDDING_SMALL = "text-embedding-3-small",
  OPENAI_EMBEDDING_LARGE = "text-embedding-3-large",
  AZURE_OPENAI = "azure-openai",
  COHEREAI_EMBED_MULTILINGUAL_LIGHT_V3_0 = "embed-multilingual-light-v3.0",
}

export const BUILTIN_EMBEDDING_MODELS: CustomModel[] = [
  {
    name: EmbeddingModels.OPENAI_EMBEDDING_SMALL,
    provider: EmbeddingModelProviders.OPENAI,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
  },
  {
    name: EmbeddingModels.OPENAI_EMBEDDING_LARGE,
    provider: EmbeddingModelProviders.OPENAI,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
  },
  {
    name: EmbeddingModels.COHEREAI_EMBED_MULTILINGUAL_LIGHT_V3_0,
    provider: EmbeddingModelProviders.COHEREAI,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
  },
  {
    name: EmbeddingModels.AZURE_OPENAI,
    provider: EmbeddingModelProviders.AZURE_OPENAI,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
  },
];

// Embedding Models
export const NOMIC_EMBED_TEXT = "nomic-embed-text";
// export const DISTILBERT_NLI = 'sentence-transformers/distilbert-base-nli-mean-tokens';
// export const INSTRUCTOR_XL = 'hkunlp/instructor-xl'; // Inference API is off for this
// export const MPNET_V2 = 'sentence-transformers/all-mpnet-base-v2'; // Inference API returns 400

export enum VAULT_VECTOR_STORE_STRATEGY {
  NEVER = "NEVER",
  ON_STARTUP = "ON STARTUP",
  ON_MODE_SWITCH = "ON MODE SWITCH",
}

export const VAULT_VECTOR_STORE_STRATEGIES = [
  VAULT_VECTOR_STORE_STRATEGY.NEVER,
  VAULT_VECTOR_STORE_STRATEGY.ON_STARTUP,
  VAULT_VECTOR_STORE_STRATEGY.ON_MODE_SWITCH,
];

export const COMMAND_IDS = {
  FIX_GRAMMAR: "fix-grammar-prompt",
  SUMMARIZE: "summarize-prompt",
  GENERATE_TOC: "generate-toc-prompt",
  EXTRACT_KEY: "extract-Key-prompt",
  SIMPLIFY: "simplify-prompt",
  PARAGRAPHING: "paragraphing-prompt",
  CN_TO_EN: "transalte-to-english-prompt",
  EN_TO_CN: "transalte-to-chinese-prompt",
  GET_TAGS: "get-tags-prompt",

  MAKE_SHORTER: "make-shorter-prompt",
  MAKE_LONGER: "make-longer-prompt",
  ENGLISH_EXPLAIN: "english-explain-prompt",
  PERFECT_TEXT: "perfect-text-prompt",

  TRANSLATE: "translate-selection-prompt",
  CHANGE_TONE: "change-tone-prompt",
  COUNT_TOKENS: "count-tokens",
  COUNT_TOTAL_VAULT_TOKENS: "count-total-vault-tokens",
};

export const DEFAULT_SETTINGS: CopilotSettings = {
  openAIApiKey: "",
  openAIOrgId: "",
  huggingfaceApiKey: "",
  cohereApiKey: "",
  anthropicApiKey: "",
  azureOpenAIApiKey: "",
  azureOpenAIApiInstanceName: "",
  azureOpenAIApiDeploymentName: "",
  azureOpenAIApiVersion: "",
  azureOpenAIApiEmbeddingDeploymentName: "",
  googleApiKey: "",
  openRouterAiApiKey: "",
  defaultModelKey: ChatModels.GPT_4o + "|" + ChatModelProviders.OPENAI,
  embeddingModelKey: EmbeddingModels.OPENAI_EMBEDDING_SMALL + "|" + ChatModelProviders.OPENAI,
  temperature: 0.1,
  maxTokens: 1000,
  contextTurns: 15,
  userSystemPrompt: "",
  openAIProxyBaseUrl: "",
  openAIEmbeddingProxyBaseUrl: "",
  stream: true,
  defaultSaveFolder: "copilot-conversations",
  autosaveChat: true,
  customPromptsFolder: "copilot-prompts",
  indexVaultToVectorStore: VAULT_VECTOR_STORE_STRATEGY.ON_MODE_SWITCH,
  qaExclusionPaths: "",
  chatNoteContextPath: "",
  chatNoteContextTags: [],
  debug: false,
  enableEncryption: false,
  maxSourceChunks: 3,
  groqApiKey: "",
  activeModels: [],
  activeEmbeddingModels: [],
  enabledCommands: {
    [COMMAND_IDS.FIX_GRAMMAR]: {
      enabled: true,
      name: "检查选中内容的语法与拼写",
    },
    [COMMAND_IDS.SUMMARIZE]: {
      enabled: true,
      name: "根据选中的内容生成摘要",
    },
    [COMMAND_IDS.GENERATE_TOC]: {
      enabled: true,
      name: "根据选中的内容生成表格",
    },
    [COMMAND_IDS.EXTRACT_KEY]: {
      enabled: true,
      name: "从选中的内容里提取重难点单词",
    },
    [COMMAND_IDS.SIMPLIFY]: {
      enabled: true,
      name: "深入分析选中的内容",
    },
    [COMMAND_IDS.PARAGRAPHING]: {
      enabled: true,
      name: "智能分段",
    },
    [COMMAND_IDS.CN_TO_EN]: {
      enabled: true,
      name: "将选中的内容翻译成英文并给出解释",
    },
    [COMMAND_IDS.EN_TO_CN]: {
      enabled: true,
      name: "将选中内容翻译成中文并给出解释",
    },
    [COMMAND_IDS.GET_TAGS]: {
      enabled: true,
      name: "从选中的内容里获取关键词作为标签",
    },
    [COMMAND_IDS.MAKE_SHORTER]: {
      enabled: true,
      name: "缩短选中的内容",
    },
    [COMMAND_IDS.MAKE_LONGER]: {
      enabled: true,
      name: "扩写选中的内容",
    },
    [COMMAND_IDS.ENGLISH_EXPLAIN]: {
      enabled: true,
      name: "用英文解释选中的内容",
    },
    [COMMAND_IDS.PERFECT_TEXT]: {
      enabled: true,
      name: "优化选中的内容【去除错别字+智能分段+修复标点符号】",
    },
    [COMMAND_IDS.TRANSLATE]: {
      enabled: true,
      name: "翻译选中的内容",
    },
    [COMMAND_IDS.CHANGE_TONE]: {
      enabled: true,
      name: "改写选中内容的风格",
    },
  },
};

export const EVENT_NAMES = {
  CHAT_IS_VISIBLE: "chat-is-visible",
};
