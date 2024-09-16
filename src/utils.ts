import { ChainType, Document } from "@/chainFactory";
import { DEFAULT_SETTINGS, NOMIC_EMBED_TEXT, USER_SENDER } from "@/constants";
import { CopilotSettings } from "@/settings/SettingsPage";
import { ChatMessage } from "@/sharedState";
import { MemoryVariables } from "@langchain/core/memory";
import { RunnableSequence } from "@langchain/core/runnables";
import { BaseChain, RetrievalQAChain } from "langchain/chains";
import moment from "moment";
import { TFile, Vault, parseYaml } from "obsidian";

export const getModelNameFromKey = (modelKey: string): string => {
  return modelKey.split("|")[0];
};

export const isFolderMatch = (fileFullpath: string, inputPath: string): boolean => {
  const fileSegments = fileFullpath.split("/").map((segment) => segment.toLowerCase());
  return fileSegments.includes(inputPath.toLowerCase());
};

export async function getNoteFileFromTitle(vault: Vault, noteTitle: string): Promise<TFile | null> {
  // Get all markdown files in the vault
  const files = vault.getMarkdownFiles();

  // Iterate through all files to find a match by title
  for (const file of files) {
    // Extract the title from the filename by removing the extension
    const title = file.basename;

    if (title === noteTitle) {
      // If a match is found, return the file path
      return file;
    }
  }

  // If no match is found, return null
  return null;
}

export const getNotesFromPath = async (vault: Vault, path: string): Promise<TFile[]> => {
  const files = vault.getMarkdownFiles();

  // Special handling for the root path '/'
  if (path === "/") {
    return files;
  }

  // Normalize the input path
  const normalizedPath = path.toLowerCase().replace(/^\/|\/$/g, "");

  return files.filter((file) => {
    // Normalize the file path
    const normalizedFilePath = file.path.toLowerCase();
    const filePathParts = normalizedFilePath.split("/");
    const pathParts = normalizedPath.split("/");

    // Check if the file path contains all parts of the input path in order
    let filePathIndex = 0;
    for (const pathPart of pathParts) {
      while (filePathIndex < filePathParts.length) {
        if (filePathParts[filePathIndex] === pathPart) {
          break;
        }
        filePathIndex++;
      }
      if (filePathIndex >= filePathParts.length) {
        return false;
      }
    }

    return true;
  });
};

export async function getTagsFromNote(file: TFile, vault: Vault): Promise<string[]> {
  const fileContent = await vault.cachedRead(file);
  // Check if the file starts with frontmatter delimiter
  if (fileContent.startsWith("---")) {
    const frontMatterBlock = fileContent.split("---", 3);
    // Ensure there's a closing delimiter for frontmatter
    if (frontMatterBlock.length >= 3) {
      const frontMatterContent = frontMatterBlock[1];
      try {
        const frontMatter = parseYaml(frontMatterContent) || {};
        const tags = frontMatter.tags || [];
        // Strip any '#' from the frontmatter tags. Obsidian sometimes has '#' sometimes doesn't...
        return tags
          .map((tag: string) => tag.replace("#", ""))
          .map((tag: string) => tag.toLowerCase());
      } catch (error) {
        console.error("Error parsing YAML frontmatter:", error);
        return [];
      }
    }
  }
  return [];
}

export async function getNotesFromTags(
  vault: Vault,
  tags: string[],
  noteFiles?: TFile[]
): Promise<TFile[]> {
  if (tags.length === 0) {
    return [];
  }

  // Strip any '#' from the tags set from the user
  tags = tags.map((tag) => tag.replace("#", ""));

  const files = noteFiles && noteFiles.length > 0 ? noteFiles : await getNotesFromPath(vault, "/");
  const filesWithTag = [];

  for (const file of files) {
    const noteTags = await getTagsFromNote(file, vault);
    if (tags.some((tag) => noteTags.includes(tag))) {
      filesWithTag.push(file);
    }
  }

  return filesWithTag;
}

export function isPathInList(filePath: string, pathList: string): boolean {
  if (!pathList) return false;

  // Extract the file name from the filePath
  const fileName = filePath.split("/").pop()?.toLowerCase();

  // Normalize the file path for case-insensitive comparison
  const normalizedFilePath = filePath.toLowerCase();

  return pathList
    .split(",")
    .map(
      (path) =>
        path
          .trim() // Trim whitespace
          .replace(/^\[\[|\]\]$/g, "") // Remove surrounding [[ and ]]
          .replace(/^\//, "") // Remove leading slash
          .toLowerCase() // Convert to lowercase for case-insensitive comparison
    )
    .some((normalizedPath) => {
      // Check for exact match or proper segmentation
      const isExactMatch =
        normalizedFilePath === normalizedPath ||
        normalizedFilePath.startsWith(normalizedPath + "/") ||
        normalizedFilePath.endsWith("/" + normalizedPath) ||
        normalizedFilePath.includes("/" + normalizedPath + "/");
      // Check for file name match (for cases like [[note1]])
      const isFileNameMatch = fileName === normalizedPath + ".md";

      return isExactMatch || isFileNameMatch;
    });
}

export const stringToChainType = (chain: string): ChainType => {
  switch (chain) {
    case "llm_chain":
      return ChainType.LLM_CHAIN;
    case "long_note_qa":
      return ChainType.LONG_NOTE_QA_CHAIN;
    case "vault_qa":
      return ChainType.VAULT_QA_CHAIN;
    default:
      throw new Error(`Unknown chain type: ${chain}`);
  }
};

export const isLLMChain = (chain: RunnableSequence): chain is RunnableSequence => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (chain as any).last.bound.modelName || (chain as any).last.bound.model;
};

export const isRetrievalQAChain = (chain: BaseChain): chain is RetrievalQAChain => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (chain as any).last.bound.retriever !== undefined;
};

export const isSupportedChain = (chain: RunnableSequence): chain is RunnableSequence => {
  return isLLMChain(chain) || isRetrievalQAChain(chain);
};

// Returns the last N messages from the chat history,
// last one being the newest ai message
export const getChatContext = (chatHistory: ChatMessage[], contextSize: number) => {
  if (chatHistory.length === 0) {
    return [];
  }
  const lastAiMessageIndex = chatHistory
    .slice()
    .reverse()
    .findIndex((msg) => msg.sender !== USER_SENDER);
  if (lastAiMessageIndex === -1) {
    // No ai messages found, return an empty array
    return [];
  }

  const lastIndex = chatHistory.length - 1 - lastAiMessageIndex;
  const startIndex = Math.max(0, lastIndex - contextSize + 1);
  return chatHistory.slice(startIndex, lastIndex + 1);
};

export const formatDateTime = (now: Date, timezone: "local" | "utc" = "local") => {
  const formattedDateTime = moment(now);

  if (timezone === "utc") {
    formattedDateTime.utc();
  }

  return {
    fileName: formattedDateTime.format("YYYYMMDD_HH;mm"),
    display: formattedDateTime.format("YYYY/MM/DD HH:mm"),
    epoch: formattedDateTime.valueOf(),
  };
};

export async function getFileContent(file: TFile, vault: Vault): Promise<string | null> {
  if (file.extension != "md") return null;
  return await vault.cachedRead(file);
}

export function getFileName(file: TFile): string {
  return file.basename;
}

export async function getAllNotesContent(vault: Vault): Promise<string> {
  let allContent = "";

  const markdownFiles = vault.getMarkdownFiles();

  for (const file of markdownFiles) {
    const fileContent = await vault.cachedRead(file);
    allContent += fileContent + " ";
  }

  return allContent;
}

export function areEmbeddingModelsSame(
  model1: string | undefined,
  model2: string | undefined
): boolean {
  if (!model1 || !model2) return false;
  // TODO: Hacks to handle different embedding model names for the same model. Need better handling.
  if (model1.includes(NOMIC_EMBED_TEXT) && model2.includes(NOMIC_EMBED_TEXT)) {
    return true;
  }
  if (
    (model1 === "small" && model2 === "cohereai") ||
    (model1 === "cohereai" && model2 === "small")
  ) {
    return true;
  }
  return model1 === model2;
}

export function sanitizeSettings(settings: CopilotSettings): CopilotSettings {
  const sanitizedSettings: CopilotSettings = { ...settings };

  // Stuff in settings are string even when the interface has number type!
  const temperature = Number(settings.temperature);
  sanitizedSettings.temperature = isNaN(temperature) ? DEFAULT_SETTINGS.temperature : temperature;

  const maxTokens = Number(settings.maxTokens);
  sanitizedSettings.maxTokens = isNaN(maxTokens) ? DEFAULT_SETTINGS.maxTokens : maxTokens;

  const contextTurns = Number(settings.contextTurns);
  sanitizedSettings.contextTurns = isNaN(contextTurns)
    ? DEFAULT_SETTINGS.contextTurns
    : contextTurns;

  return sanitizedSettings;
}

// Basic prompts
// Note that GPT4 is much better at following instructions than GPT3.5!
export function sendNoteContentPrompt(noteName: string, noteContent: string | null): string {
  return (
    `Please read the note below and be ready to answer questions about it. ` +
    `If there's no information about a certain topic, just say the note ` +
    `does not mention it. ` +
    `The content of the note is between "/***/":\n\n/***/\n\n${noteContent}\n\n/***/\n\n` +
    `Please reply with the following word for word:` +
    `"OK I've read this note titled [[ ${noteName} ]]. ` +
    `Feel free to ask related questions, such as 'give me a summary of this note in bullet points', 'what key questions does it answer', etc. "\n`
  );
}

export function sendNotesContentPrompt(notes: { name: string; content: string }[]): string {
  return (
    `Please read the notes below and be ready to answer questions about them. ` +
    `If there's no information about a certain topic, just say the note ` +
    `does not mention it. ` +
    `The content of the note is between "/***/":\n\n/***/\n\n${JSON.stringify(notes)}\n\n/***/\n\n` +
    `Please reply with the following word for word:` +
    `"OK I've read these notes. ` +
    `Feel free to ask related questions, such as 'give me a summary of these notes in bullet points', 'what key questions does these notes answer', etc. "\n`
  );
}

function getNoteTitleAndTags(noteWithTag: {
  name: string;
  content: string;
  tags?: string[];
}): string {
  return (
    `[[${noteWithTag.name}]]` +
    (noteWithTag.tags && noteWithTag.tags.length > 0 ? `\ntags: ${noteWithTag.tags.join(",")}` : "")
  );
}

function getChatContextStr(chatNoteContextPath: string, chatNoteContextTags: string[]): string {
  const pathStr = chatNoteContextPath ? `\nChat context by path: ${chatNoteContextPath}` : "";
  const tagsStr =
    chatNoteContextTags?.length > 0 ? `\nChat context by tags: ${chatNoteContextTags}` : "";
  return pathStr + tagsStr;
}

export function getSendChatContextNotesPrompt(
  notes: { name: string; content: string }[],
  chatNoteContextPath: string,
  chatNoteContextTags: string[]
): string {
  const noteTitles = notes.map((note) => getNoteTitleAndTags(note)).join("\n\n");
  return (
    `Please read the notes below and be ready to answer questions about them. ` +
    getChatContextStr(chatNoteContextPath, chatNoteContextTags) +
    `\n\n${noteTitles}`
  );
}

// 修正语法与拼写
export function fixGrammarSpellingSelectionPrompt(selectedText: string): string {
  return (
    `[user]: Please fix the grammar and spelling of the following text and return it without any other changes,\n\nHere is the text:\n\n【【【${selectedText}】】】
[assistant]: OK, My response is :`
  );
}

// 总结文本
export function summarizePrompt(selectedText: string): string {
  return (
    `[user]: Summarize the following text into bullet points and return it without any other changes. Identify the input language, and return the summary in the same language. If the input is English, return the summary in English. Otherwise, return in the same language as the input. Return ONLY the summary, DO NOT return the name of the language. Here is the text:\n\n【【【${selectedText}】】】
[assistant]: OK, I will reply according to the language of the input text.
 My response is :`
  );
}

// 转化成表格
export function tocPrompt(selectedText: string): string {
  return (
    `Please generate a table of contents for the following text and return it without any other changes. Output in the same language as the source, do not output English if it is not English:\n\n` +
    `${selectedText}`
  );
}

// 为英文文本生成重难点单词
export function extractKeyPrompt(selectedText: string): string {
  return (
    `[user]: Extract challenging or advanced English words from the text I provided. For each word, include the following information:

1. The word itself, presented in boldface format.
2. The phonetic transcription (IPA format), presented in inline code format.
3. The Chinese definition of the word.
4. The part of speech, using abbreviations (e.g., n. for noun, v. for verb, adj. for adjective, etc.) as it appears in the context.

Output this information in a Markdown ordered list format, with each word item containing the word, its phonetic transcription (in inline code format), its Chinese definition, and its part of speech in abbreviated form.

[user]: Here is an example: 【1. preoccupied \`/ˌpriːˈɒkjupaɪd/\`: 全神贯注的，心事重重的。(adj.)】

Here is the text that needs to be processed:

【【【${selectedText}】】】

[assistant]: OK, My response is:`
  );
}

// 分析问题
export function simplifyPrompt(selectedText: string): string {
  return (
    `[user]: Please help me understand the following topic/concept. I would like you to break down the explanation step by step, guiding me progressively from basic to more complex ideas. Start by explaining the fundamental concepts in simple terms, then gradually introduce more detailed information and examples. If possible, highlight any related concepts or background knowledge that could help in understanding. I may ask follow-up questions if something is unclear.

[user]: Output in the same language as the source, do not output English if it is not English.
[user]: Here is the topic I need help with:

【【【${selectedText}】】】

[assistant]: OK, I will reply according to the language of the input text. My response is :`
  );
}

// 智能分段
export function ParagraphingPrompt(selectedText: string): string {
  return (
    `To improve readability, divide the input text into sections based on its meaning, but do not modify any part of the content. Please note, do not modify any part of the text, including punctuation or word order. Simply break the text into paragraphs by adding line breaks or empty lines at appropriate places, ensuring each paragraph is semantically complete and coherent.

Here is the text:

【【【${selectedText}】】】`
  );
}

// 将中文翻译成英文，并给出翻译解释
export function cn2enPrompt(selectedText: string): string {
  return (
    `Please help me translate the following Chinese text into natural and fluent English while ensuring that the original meaning is preserved. Additionally, explain the basis for your translation choices, particularly how you adjusted the phrasing to fit English idiomatic expressions or cultural nuances.

  The translation should:
  
  1. Retain the core meaning of the original Chinese.
  2. Be expressed in a way that aligns with English-speaking conventions.
  3. Provide brief commentary on translation decisions in Chinese, including:
    - Adjustments made for tone or style differences between Chinese and English.
    - Changes to sentence structure or word choice to enhance readability or clarity.
    - Any cultural context that influenced the translation.
  
  Here is the text for translation:
  
【【【${selectedText}】】】`
  );
}

// 将英文翻译成中文，并给出翻译解释
export function en2cnPrompt(selectedText: string): string {
  return `Please translate the following English text into natural and fluent Chinese while preserving the original meaning. Additionally, provide a brief explanation of your translation choices, focusing on how you adapted the phrasing to fit Chinese idiomatic expressions and cultural nuances.

The translation should:

1. Accurately convey the core meaning of the original English text.
2. Follow conventions of natural, idiomatic Chinese expression.
3. Include brief commentary in Chinese, addressing:
  - Adjustments for tone, style, or cultural nuances between English and Chinese.
  - Modifications in sentence structure or word choice to improve readability and clarity.
  - Any cultural considerations that influenced the translation.
  
Here is the text for translation:

【【【${selectedText}】】】`;
}

// 生成标签
export function getTagsFromSelectionPrompt(selectedText: string): string {
  return (
    `Extract the most important keywords from the following text and list them as tags. Each keyword should be preceded by the symbol "#" and separated by a space. The keywords should capture the core concepts and themes of the text, ensuring coverage of the main content. 

The text is as follows:

[[[${selectedText}]]]

Please list the keywords in the specified format. The output language should match the language of the input text.`
  );
}

// 缩短文本
export function rewriteShorterSelectionPrompt(selectedText: string): string {
  return (
    `Shorten the following text while retaining its full meaning. Output in the same language as the source, do not output English if it is not English:

Here is the text that needs to be shorten:

[[[${selectedText}]]]`
  );
}

// 扩写文本
export function rewriteLongerSelectionPrompt(selectedText: string): string {
  return (
    `Expand the short text provided by the user into a rich, well-structured long text, enhancing its appeal and expressiveness. The expanded text should maintain the original theme and style, avoiding deviation from the original meaning. The content should be coherent, logical, and well-developed.

  1. Carefully read and understand the content and intent of the original text.
  2. Determine the direction and focus of the expansion, including adding background information, character 3. descriptions, emotional depth, etc.
  3. Creatively compose and expand the text while ensuring coherence and consistency.
  4. Review and edit the expanded text to ensure smooth language and clear logic.

Here is the text that needs to be processed:

[[[${selectedText}]]]`
  );
}

// 用简单英文解释复杂英文
export function englishExplainSelectionPrompt(selectedText: string): string {
  return (
    `You are going to explain the following English sentence or word in a simple and easy-to-understand way for an English beginner. Your explanation should be in English and should help the user understand the original sentence or word better. If it's a sentence, break down any difficult words or phrases. If it's a word, explain its meaning and usage. Make sure your explanation is clear and accessible for someone new to learning English. 

The input is:

[[[${selectedText}]]]

Please provide a straightforward and easy-to-follow explanation.`
  );
}

// 优化文本
export function perfectSelectionPrompt(selectedText: string): string {
  return (
    `Without altering the original intent and style, correct any typos, misspellings, and improper punctuation in the text. Adjust sentence structure where necessary to ensure the text's accuracy and professionalism. To improve readability, add paragraph breaks in appropriate places. The original mea ning and style of the text must be preserved, and no content should be added or removed. The output must be in the original language of the text.

Here is the text: 

[[[${selectedText}]]]`
  );
}

export function createTranslateSelectionPrompt(language?: string) {
  return (selectedText: string): string => {
    return `Please translate the following text to ${language}:\n\n` + `${selectedText}`;
  };
}

export function createChangeToneSelectionPrompt(tone?: string) {
  return (selectedText: string): string => {
    return (
      `${prompt}. Output in the same language as the source, do not output English if it is not English:

Here is the text: 

[[[${selectedText}]]]`
    );
  };
}

export function extractChatHistory(memoryVariables: MemoryVariables): [string, string][] {
  const chatHistory: [string, string][] = [];
  const { history } = memoryVariables;

  for (let i = 0; i < history.length; i += 2) {
    const userMessage = history[i]?.content || "";
    const aiMessage = history[i + 1]?.content || "";
    chatHistory.push([userMessage, aiMessage]);
  }

  return chatHistory;
}

export function extractNoteTitles(query: string): string[] {
  // Use a regular expression to extract note titles wrapped in [[]]
  const regex = /\[\[(.*?)\]\]/g;
  const matches = query.match(regex);
  const uniqueTitles = new Set(matches ? matches.map((match) => match.slice(2, -2)) : []);
  return Array.from(uniqueTitles);
}

/**
 * Process the variable name to generate a note path if it's enclosed in double brackets,
 * otherwise return the variable name as is.
 *
 * @param {string} variableName - The name of the variable to process
 * @return {string} The processed note path or the variable name itself
 */
export function processVariableNameForNotePath(variableName: string): string {
  variableName = variableName.trim();
  // Check if the variable name is enclosed in double brackets indicating it's a note
  if (variableName.startsWith("[[") && variableName.endsWith("]]")) {
    // It's a note, so we remove the brackets and append '.md'
    return `${variableName.slice(2, -2).trim()}.md`;
  }
  // It's a path, so we just return it as is
  return variableName;
}

export function extractUniqueTitlesFromDocs(docs: Document[]): string[] {
  const titlesSet = new Set<string>();
  docs.forEach((doc) => {
    if (doc.metadata?.title) {
      titlesSet.add(doc.metadata?.title);
    }
  });

  return Array.from(titlesSet);
}
