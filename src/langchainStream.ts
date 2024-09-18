import ChainManager from "@/LLMProviders/chainManager";
import { ChatMessage } from "@/sharedState";
import { Notice } from "obsidian";
import { string } from "prop-types";

export type Role = "assistant" | "user" | "system";

export const getAIResponse = async (
  userMessage: ChatMessage,
  chainManager: ChainManager,
  addMessage: (message: ChatMessage) => void,
  updateCurrentAiMessage: (message: string) => void,
  updateShouldAbort: (abortController: AbortController | null) => void,
  options: {
    debug?: boolean;
    ignoreSystemMessage?: boolean;
    updateLoading?: (loading: boolean) => void;
  } = {}
) => {
  const abortController = new AbortController();
  updateShouldAbort(abortController);

  let res = ''
  try {
    res = await chainManager.runChain(
      userMessage.message,
      abortController,
      updateCurrentAiMessage,
      addMessage,
      options
    );
  } catch (error) {
    console.error("该模型请求失败:", error);
    new Notice("该模型请求失败:", error);
  } finally {
    return res
  }
};
