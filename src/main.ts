import ChainManager from "@/LLMProviders/chainManager";
import EmbeddingsManager from "@/LLMProviders/embeddingManager";
import { CustomModel, LangChainParams, SetChainOptions } from "@/aiParams";
import { ChainType } from "@/chainFactory";
import { registerBuiltInCommands } from "@/commands";
import { AddPromptModal } from "@/components/AddPromptModal";
import { AdhocPromptModal } from "@/components/AdhocPromptModal";
import { ChatNoteContextModal } from "@/components/ChatNoteContextModal";
import CopilotView from "@/components/CopilotView";
import { ListPromptModal } from "@/components/ListPromptModal";
import { LoadChatHistoryModal } from "@/components/LoadChatHistoryModal";
import { QAExclusionModal } from "@/components/QAExclusionModal";
import {
  AI_SENDER,
  BUILTIN_CHAT_MODELS,
  BUILTIN_EMBEDDING_MODELS,
  CHAT_VIEWTYPE,
  DEFAULT_SETTINGS,
  DEFAULT_SYSTEM_PROMPT,
  USER_SENDER,
  EVENT_NAMES,
  VAULT_VECTOR_STORE_STRATEGY,
} from "@/constants";
import { CustomPrompt, CustomPromptDB, CustomPromptProcessor } from "@/customPromptProcessor";
import EncryptionService from "@/encryptionService";
import { CopilotSettings, CopilotSettingTab } from "@/settings/SettingsPage";
import SharedState, { ChatMessage } from "@/sharedState";
import {
  areEmbeddingModelsSame,
  getAllNotesContent,
  isPathInList,
  sanitizeSettings,
} from "@/utils";
import VectorDBManager, { VectorStoreDocument } from "@/vectorDBManager";
import { MD5 } from "crypto-js";
import {
  Editor,
  MarkdownView,
  Menu,
  Notice,
  Plugin,
  TFile,
  TFolder,
  WorkspaceLeaf,
} from "obsidian";
import PouchDB from "pouchdb-browser";
import { CustomError } from "@/error";

// 测试代码

import { getAIResponse } from "@/langchainStream";
// 测试代码

export default class CopilotPlugin extends Plugin {
  settings: CopilotSettings;
  // A chat history that stores the messages sent and received
  // Only reset when the user explicitly clicks "New Chat"
  sharedState: SharedState;
  chainManager: ChainManager;
  activateViewPromise: Promise<void> | null = null;
  chatIsVisible = false;
  dbPrompts: PouchDB.Database;
  dbVectorStores: PouchDB.Database<VectorStoreDocument>;
  embeddingsManager: EmbeddingsManager;
  encryptionService: EncryptionService;
  userMessageHistory: string[] = [];

  isChatVisible = () => this.chatIsVisible;

  async onload(): Promise<void> {

    // 加载配置
    await this.loadSettings();

    // 添加配置界面
    this.addSettingTab(new CopilotSettingTab(this.app, this));

    // Always have one instance of sharedState and chainManager in the plugin
    this.sharedState = new SharedState();
    const langChainParams = this.getChainManagerParams();
    this.encryptionService = new EncryptionService(this.settings);
    this.dbVectorStores = new PouchDB<VectorStoreDocument>(
      `copilot_vector_stores_${this.getVaultIdentifier()}`
    );

    this.mergeAllActiveModelsWithExisting();
    this.chainManager = new ChainManager(
      this.app,
      langChainParams,
      this.encryptionService,
      this.settings,
      () => this.dbVectorStores
    );

    if (this.settings.enableEncryption) {
      await this.saveSettings();
    }

    this.embeddingsManager = EmbeddingsManager.getInstance(
      () => langChainParams,
      this.encryptionService,
      this.settings.activeEmbeddingModels
    );
    this.dbPrompts = new PouchDB<CustomPrompt>("copilot_custom_prompts");

    this.registerView(CHAT_VIEWTYPE, (leaf: WorkspaceLeaf) => new CopilotView(leaf, this));

    this.initActiveLeafChangeHandler();

    this.addCommand({
      id: "chat-toggle-window",
      icon: 'message-square-more',
      name: "打开/关闭copilot聊天框 (右侧区域)",
      callback: () => {
        this.toggleView();
      },
    });

    this.addCommand({
      id: "chat-toggle-window-note-area",
      icon: 'circle-ellipsis',
      name: "打开/关闭copilot聊天框 (笔记区域)",
      callback: () => {
        this.toggleViewNoteArea();
      },
    });

    this.addRibbonIcon("message-square", "Copilot 会话", (evt: MouseEvent) => {
      this.toggleView();
    });

    registerBuiltInCommands(this);

    const promptProcessor = CustomPromptProcessor.getInstance(this.app.vault, this.settings);

    this.addCommand({
      id: "add-custom-prompt",
      icon: 'plus',
      name: "添加自定义 prompt",
      callback: () => {
        new AddPromptModal(this.app, async (title: string, prompt: string) => {
          try {
            await promptProcessor.savePrompt(title, prompt);
            new Notice("自定义 prompt 添加成功");
          } catch (e) {
            new Notice("添加失败！请检查该 prompt 标题是否已存在");
            console.error(e);
          }
        }).open();
      },
    });

    this.addCommand({
      id: "apply-custom-prompt",
      icon: 'pointer',
      name: "应用自定义 prompt",
      callback: async () => {
        const prompts = await promptProcessor.getAllPrompts();
        const promptTitles = prompts.map((p) => p.title);
        new ListPromptModal(this.app, promptTitles, async (promptTitle: string) => {
          if (!promptTitle) {
            new Notice("请选择一条 prompt");
            return;
          }
          try {
            const prompt = await promptProcessor.getPrompt(promptTitle);
            if (!prompt) {
              new Notice(`搜索不到【${promptTitle}】`);
              return;
            }
            this.processCustomPrompt("applyCustomPrompt", prompt.content);
          } catch (err) {
            console.error(err);
            new Notice("出现未知错误");
          }
        }).open();
      },
    });

    this.addCommand({
      id: "apply-adhoc-prompt",
      icon: 'bot',
      name: "copilot 对话",
      callback: async () => {
        const modal = new AdhocPromptModal(this.app, async (adhocPrompt: string) => {
          try {
            this.processCustomPrompt("applyAdhocPrompt", adhocPrompt);
          } catch (err) {
            console.error(err);
            new Notice("出现未知错误");
          }
        });

        modal.open();
      },
    });

    this.addCommand({
      id: "delete-custom-prompt",
      icon: 'x',
      name: "删除自定义 prompt",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }

        promptProcessor.getAllPrompts().then((prompts) => {
          const promptTitles = prompts.map((p) => p.title);
          new ListPromptModal(this.app, promptTitles, async (promptTitle: string) => {
            if (!promptTitle) {
              new Notice("请选择一条 prompt");
              return;
            }

            try {
              await promptProcessor.deletePrompt(promptTitle);
              new Notice(`Prompt "${promptTitle}" 已被删除`);
            } catch (err) {
              console.error(err);
              new Notice("删除 prompt 时出现未知错误");
            }
          }).open();
        });

        return true;
      },
    });

    this.addCommand({
      id: "edit-custom-prompt",
      icon: 'pencil',
      name: "编辑自定义 prompt",
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }

        promptProcessor.getAllPrompts().then((prompts) => {
          const promptTitles = prompts.map((p) => p.title);
          new ListPromptModal(this.app, promptTitles, async (promptTitle: string) => {
            if (!promptTitle) {
              new Notice("请选择一条 prompt");
              return;
            }

            try {
              const prompt = await promptProcessor.getPrompt(promptTitle);
              if (prompt) {
                new AddPromptModal(
                  this.app,
                  async (title: string, newPrompt: string) => {
                    try {
                      await promptProcessor.updatePrompt(promptTitle, title, newPrompt);
                      new Notice(`Prompt "${title}" 已被更新`);
                    } catch (err) {
                      console.error(err);
                      if (err instanceof CustomError) {
                        new Notice(err.msg);
                      } else {
                        new Notice("出现未知错误");
                      }
                    }
                  },
                  prompt.title,
                  prompt.content,
                  false
                ).open();
              } else {
                new Notice(`没有找到这个prompt: "${promptTitle}".`);
              }
            } catch (err) {
              console.error(err);
              new Notice("出现未知错误");
            }
          }).open();
        });

        return true;
      },
    });

    this.addCommand({
      id: "clear-local-vector-store",
      icon: 'trash',
      name: "清除本地向量索引",
      callback: async () => {
        try {
          // Clear the vectorstore db
          await this.dbVectorStores.destroy();
          // Reinitialize the database
          this.dbVectorStores = new PouchDB<VectorStoreDocument>(
            `copilot_vector_stores_${this.getVaultIdentifier()}`
          );
          new Notice("Local vector store cleared successfully.");
          console.log("Local vector store cleared successfully, new instance created.");
        } catch (err) {
          console.error("Error clearing the local vector store:", err);
          new Notice("An error occurred while clearing the local vector store.");
        }
      },
    });

    this.addCommand({
      id: "garbage-collect-vector-store",
      icon: 'trash-2',
      name: "清理索引存储 (移除不存在的文件)",
      callback: async () => {
        try {
          const files = this.app.vault.getMarkdownFiles();
          const filePaths = files.map((file) => file.path);
          const indexedFiles = await VectorDBManager.getNoteFiles(this.dbVectorStores);
          const indexedFilePaths = indexedFiles.map((file) => file.path);
          const filesToDelete = indexedFilePaths.filter(
            (filePath) => !filePaths.includes(filePath)
          );

          const deletePromises = filesToDelete.map(async (filePath) => {
            VectorDBManager.removeMemoryVectors(
              this.dbVectorStores,
              VectorDBManager.getDocumentHash(filePath)
            );
          });

          await Promise.all(deletePromises);

          new Notice("Local vector store garbage collected successfully.");
          console.log("Local vector store garbage collected successfully, new instance created.");
        } catch (err) {
          console.error("Error clearing the local vector store:", err);
          new Notice("An error occurred while clearing the local vector store.");
        }
      },
    });

    this.addCommand({
      id: "index-vault-to-vector-store",
      icon: 'refresh-ccw',
      name: "刷新索引 (QA模式)",
      callback: async () => {
        try {
          const indexedFileCount = await this.indexVaultToVectorStore();

          new Notice(`${indexedFileCount} vault files indexed to vector store.`);
          console.log(`${indexedFileCount} vault files indexed to vector store.`);
        } catch (err) {
          console.error("Error indexing vault to vector store:", err);
          new Notice("An error occurred while indexing vault to vector store.");
        }
      },
    });

    this.addCommand({
      id: "force-reindex-vault-to-vector-store",
      icon: 'zap',
      name: "强制刷新索引 (QA模式)",
      callback: async () => {
        try {
          const indexedFileCount = await this.indexVaultToVectorStore(true);

          new Notice(`${indexedFileCount} vault files indexed to vector store.`);
          console.log(`${indexedFileCount} vault files indexed to vector store.`);
        } catch (err) {
          console.error("Error re-indexing vault to vector store:", err);
          new Notice("An error occurred while re-indexing vault to vector store.");
        }
      },
    });

    this.addCommand({
      id: "set-chat-note-context",
      icon: 'scroll-text',
      name: "设置聊天框笔记",
      callback: async () => {
        new ChatNoteContextModal(this.app, this.settings, async (path: string, tags: string[]) => {
          // Store the path in the plugin's settings, default to empty string
          this.settings.chatNoteContextPath = path;
          this.settings.chatNoteContextTags = tags;
          await this.saveSettings();
        }).open();
      },
    });

    this.addCommand({
      id: "set-vault-qa-exclusion",
      icon: 'badge-minus',
      name: "为 QA 模式设置排除项",
      callback: async () => {
        new QAExclusionModal(this.app, this.settings, async (paths: string) => {
          // Store the path in the plugin's settings, default to empty string
          this.settings.qaExclusionPaths = paths;
          await this.saveSettings();
        }).open();
      },
    });

    this.addCommand({
      id: "load-copilot-chat-conversation",
      icon: 'hard-drive-upload',
      name: "加载历史会话",
      callback: () => {
        this.loadCopilotChatHistory();
      },
    });

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        const docHash = VectorDBManager.getDocumentHash(file.path);
        VectorDBManager.removeMemoryVectors(this.dbVectorStores, docHash);
      })
    );

    // Index vault to vector store on startup and after loading all commands
    // This can take a while, so we don't want to block the startup process
    if (this.settings.indexVaultToVectorStore === VAULT_VECTOR_STORE_STRATEGY.ON_STARTUP) {
      try {
        await this.indexVaultToVectorStore();
      } catch (err) {
        console.error("Error saving vault to vector store:", err);
        new Notice("An error occurred while saving vault to vector store.");
      }
    }

    // Temporary: Migrate Custom Prompts from PouchDB to Markdown files.
    this.addCommand({
      id: "dump-custom-prompts-to-markdown",
      icon: 'hard-drive-download',
      name: "将自定义prompts 存储到 Markdown 文件",
      callback: async () => {
        await this.dumpCustomPrompts();
      },
    });

    this.registerEvent(this.app.workspace.on("editor-menu", this.handleContextMenu));


    // 添加测试代码
    // this.addRibbonIcon("bot", "测试AI", async () => {
    //   new Notice('测试AI')
    //   const res = await getAIResponse(
    //     {
    //       'isVisible': false,
    //       'message': '2+2等于多少',
    //       'sender': "【User】",
    //     },
    //     this.chainManager,
    //     () => { },
    //     () => { },
    //     () => { },
    //     { 'debug': false }
    //   );
    //   console.log(res)
    // });

  }

  updateUserMessageHistory(newMessage: string) {
    this.userMessageHistory = [...this.userMessageHistory, newMessage];
  }

  async autosaveCurrentChat() {
    if (this.settings.autosaveChat) {
      const chatView = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE)[0]?.view as CopilotView;
      if (chatView && chatView.sharedState.chatHistory.length > 0) {
        await chatView.saveChat();
      }
    }
  }

  async dumpCustomPrompts(): Promise<void> {
    const folder = this.settings.customPromptsFolder || DEFAULT_SETTINGS.customPromptsFolder;

    try {
      // Ensure the folder exists
      if (!(await this.app.vault.adapter.exists(folder))) {
        await this.app.vault.createFolder(folder);
      }

      // Fetch all prompts
      const response = await this.dbPrompts.allDocs({ include_docs: true });

      for (const row of response.rows) {
        const doc = row.doc as CustomPromptDB;
        if (doc && doc._id && doc.prompt) {
          const fileName = `${folder}/${doc._id}.md`;
          await this.app.vault.create(fileName, doc.prompt);
        }
      }

      new Notice(`自定义 prompts 保存到了【${folder}】目录下`);
    } catch (error) {
      console.error("Error dumping custom prompts:", error);
      new Notice("导出自定义prompts时出错。请查看控制台以获取详细信息。");
    }
  }

  private getVaultIdentifier(): string {
    const vaultName = this.app.vault.getName();
    return MD5(vaultName).toString();
  }

  async saveFileToVectorStore(file: TFile): Promise<void> {
    const embeddingInstance = this.embeddingsManager.getEmbeddingsAPI();
    if (!embeddingInstance) {
      new Notice("没有找到 Embedding 实例");
      return;
    }
    const fileContent = await this.app.vault.cachedRead(file);
    const fileMetadata = this.app.metadataCache.getFileCache(file);
    const noteFile = {
      basename: file.basename,
      path: file.path,
      mtime: file.stat.mtime,
      content: fileContent,
      metadata: fileMetadata?.frontmatter ?? {},
    };
    VectorDBManager.indexFile(this.dbVectorStores, embeddingInstance, noteFile);
  }

  async indexVaultToVectorStore(overwrite?: boolean): Promise<number> {
    const embeddingInstance = this.embeddingsManager.getEmbeddingsAPI();
    if (!embeddingInstance) {
      throw new Error("没有找到 Embedding 实例");
    }

    // Check if embedding model has changed
    const prevEmbeddingModel = await VectorDBManager.checkEmbeddingModel(this.dbVectorStores);
    // TODO: Remove this when Ollama model is dynamically set
    const currEmbeddingModel = EmbeddingsManager.getModelName(embeddingInstance);

    if (this.settings.debug)
      console.log("Prev vs Current embedding models:", prevEmbeddingModel, currEmbeddingModel);

    if (!areEmbeddingModelsSame(prevEmbeddingModel, currEmbeddingModel)) {
      // Model has changed, clear DB and reindex from scratch
      overwrite = true;
      // Clear the current vector store with mixed embeddings
      try {
        // Clear the vectorstore db
        await this.dbVectorStores.destroy();
        // Reinitialize the database
        this.dbVectorStores = new PouchDB<VectorStoreDocument>(
          `copilot_vector_stores_${this.getVaultIdentifier()}`
        );
        new Notice("检测到嵌入模型发生变化。从头开始重建向量存储库。");
        console.log("检测到嵌入模型发生变化。从头开始重建向量存储库。");
      } catch (err) {
        console.error("清除向量存储库以便重新索引时出错。", err);
        new Notice("清除向量存储库以便重新索引时出错。");
      }
    }

    const latestMtime = await VectorDBManager.getLatestFileMtime(this.dbVectorStores);

    const files = this.app.vault
      .getMarkdownFiles()
      .filter((file) => {
        if (!latestMtime || overwrite) return true;
        return file.stat.mtime > latestMtime;
      })
      // file not in qaExclusionPaths
      .filter((file) => {
        if (!this.settings.qaExclusionPaths) return true;
        return !isPathInList(file.path, this.settings.qaExclusionPaths);
      });

    const fileContents: string[] = await Promise.all(
      files.map((file) => this.app.vault.cachedRead(file))
    );
    const fileMetadatas = files.map((file) => this.app.metadataCache.getFileCache(file));

    const totalFiles = files.length;
    if (totalFiles === 0) {
      new Notice("Copilot-Chinese: 当前索引是最新的");
      return 0;
    }

    let indexedCount = 0;
    const indexNotice = new Notice(
      `正在建立索引...\n0/${totalFiles} 个文件.`,
      0
    );

    const errors: string[] = [];
    const loadPromises = files.map(async (file, index) => {
      try {
        const noteFile = {
          basename: file.basename,
          path: file.path,
          mtime: file.stat.mtime,
          content: fileContents[index],
          metadata: fileMetadatas[index]?.frontmatter ?? {},
        };
        const result = await VectorDBManager.indexFile(
          this.dbVectorStores,
          embeddingInstance,
          noteFile
        );

        indexedCount++;
        indexNotice.setMessage(
          `正在建立索引...\n${indexedCount}/${totalFiles} 个文件.`
        );
        return result;
      } catch (err) {
        console.error("Error indexing file:", err);
        errors.push(`Error indexing file: ${file.basename}`);
      }
    });

    await Promise.all(loadPromises);
    setTimeout(() => {
      indexNotice.hide();
    }, 2000);

    if (errors.length > 0) {
      new Notice(`索引完成但有错误。请查看控制台以获取详细信息。`);
      console.log("Indexing Errors:", errors.join("\n"));
    }
    return files.length;
  }

  async processText(
    editor: Editor,
    eventType: string,
    eventSubtype?: string,
    checkSelectedText = true
  ) {

    let selectedText = await editor.getSelection();

    if (selectedText === "") {
      selectedText = this.getCurrentParagraph();
    }

    const isChatWindowActive = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE).length > 0;

    if (!isChatWindowActive) {
      await this.activateView();
    }

    // Without the timeout, the view is not yet active
    setTimeout(() => {
      const activeCopilotView = this.app.workspace
        .getLeavesOfType(CHAT_VIEWTYPE)
        .find((leaf) => leaf.view instanceof CopilotView)?.view as CopilotView;
      if (activeCopilotView && (!checkSelectedText || selectedText)) {
        const event = new CustomEvent(eventType, { detail: { selectedText, eventSubtype } });
        activeCopilotView.emitter.dispatchEvent(event);
      }
    }, 0);
  }

  processSelection(editor: Editor, eventType: string, eventSubtype?: string) {
    this.processText(editor, eventType, eventSubtype);
  }

  processChatIsVisible(chatIsVisible: boolean) {
    if (this.chatIsVisible === chatIsVisible) {
      return;
    }

    this.chatIsVisible = chatIsVisible;

    const activeCopilotView = this.app.workspace
      .getLeavesOfType(CHAT_VIEWTYPE)
      .find((leaf) => leaf.view instanceof CopilotView)?.view as CopilotView;

    if (activeCopilotView) {
      const event = new CustomEvent(EVENT_NAMES.CHAT_IS_VISIBLE, {
        detail: { chatIsVisible: this.chatIsVisible },
      });
      activeCopilotView.emitter.dispatchEvent(event);
    }
  }

  initActiveLeafChangeHandler() {
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        if (!leaf) {
          return;
        }
        this.processChatIsVisible(leaf.getViewState().type === CHAT_VIEWTYPE);
      })
    );
  }

  private getCurrentEditorOrDummy(): Editor {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    return {
      getSelection: () => {
        const selection = activeView?.editor?.getSelection();
        if (selection) return selection;
        // Default to the entire active file if no selection
        const activeFile = this.app.workspace.getActiveFile();
        return activeFile ? this.app.vault.cachedRead(activeFile) : "";
      },
      replaceSelection: activeView?.editor?.replaceSelection.bind(activeView.editor) || (() => { }),
    } as Partial<Editor> as Editor;
  }

  processCustomPrompt(eventType: string, customPrompt: string) {
    const editor = this.getCurrentEditorOrDummy();
    this.processText(editor, eventType, customPrompt, false);
  }

  toggleView() {
    const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE);
    leaves.length > 0 ? this.deactivateView() : this.activateView();
  }

  async activateView(): Promise<void> {
    this.app.workspace.detachLeavesOfType(CHAT_VIEWTYPE);
    this.activateViewPromise = this.app.workspace.getRightLeaf(false).setViewState({
      type: CHAT_VIEWTYPE,
      active: true,
    });
    await this.activateViewPromise;
    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE)[0]);
    this.processChatIsVisible(true);
  }

  async deactivateView() {
    this.app.workspace.detachLeavesOfType(CHAT_VIEWTYPE);
    this.processChatIsVisible(false);
  }

  async toggleViewNoteArea() {
    const leaves = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE);
    leaves.length > 0 ? this.deactivateView() : this.activateViewNoteArea();
  }

  async activateViewNoteArea() {
    this.app.workspace.detachLeavesOfType(CHAT_VIEWTYPE);
    this.activateViewPromise = this.app.workspace.getLeaf(true).setViewState({
      type: CHAT_VIEWTYPE,
      active: true,
    });
    await this.activateViewPromise;
    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE)[0]);
    this.processChatIsVisible(true);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    // Ensure activeModels always includes builtInModels
    this.mergeAllActiveModelsWithExisting();
  }

  mergeActiveModels(
    existingActiveModels: CustomModel[],
    builtInModels: CustomModel[]
  ): CustomModel[] {
    const modelMap = new Map<string, CustomModel>();

    // Create a unique key for each model, it's model (name + provider)
    const getModelKey = (model: CustomModel) => `${model.name}|${model.provider}`;

    // Add built-in models to the map
    builtInModels.forEach((model) => {
      modelMap.set(getModelKey(model), { ...model, isBuiltIn: true });
    });

    // Add or update existing models in the map
    existingActiveModels.forEach((model) => {
      const key = getModelKey(model);
      const existingModel = modelMap.get(key);
      if (existingModel) {
        // If it's a built-in model, preserve the built-in status
        modelMap.set(key, {
          ...model,
          isBuiltIn: existingModel.isBuiltIn || model.isBuiltIn,
        });
      } else {
        modelMap.set(key, { ...model, isBuiltIn: false });
      }
    });

    return Array.from(modelMap.values());
  }

  mergeAllActiveModelsWithExisting(): void {
    this.settings.activeModels = this.mergeActiveModels(
      this.settings.activeModels,
      BUILTIN_CHAT_MODELS
    );
    this.settings.activeEmbeddingModels = this.mergeActiveModels(
      this.settings.activeEmbeddingModels,
      BUILTIN_EMBEDDING_MODELS
    );
  }

  async saveSettings(): Promise<void> {
    if (this.settings.enableEncryption) {
      // Encrypt all API keys before saving
      this.encryptionService.encryptAllKeys();
    }

    // Ensure activeModels is merged before saving
    this.mergeAllActiveModelsWithExisting();

    await this.saveData(this.settings);
  }

  async countTotalTokens(): Promise<number> {
    try {
      const allContent = await getAllNotesContent(this.app.vault);
      const totalTokens = await this.chainManager.chatModelManager.countTokens(allContent);
      return totalTokens;
    } catch (error) {
      console.error("Error counting tokens: ", error);
      return 0;
    }
  }

  handleContextMenu = (menu: Menu, editor: Editor): void => {
    this.addContextMenu(menu, editor, this);
  };

  addContextMenu = (menu: Menu, editor: Editor, plugin: this): void => {
    menu.addItem((item) => {
      item
        .setTitle("Copilot: 智能分段")
        .setIcon("bot")
        .onClick(async (e) => {
          plugin.processSelection(editor, "ParagraphingSelection");
        });
    });

    menu.addItem((item) => {
      item
        .setTitle("Copilot: 优化文本")
        .setIcon("bot")
        .onClick(async (e) => {
          plugin.processSelection(editor, "perfectSelectionSelection");
        });
    });

    menu.addItem((item) => {
      item
        .setTitle("Copilot: 中翻英")
        .setIcon("bot")
        .onClick(async (e) => {
          plugin.processSelection(editor, "transalteSelectionToEnglish");
        });
    });


  };

  getChainManagerParams(): LangChainParams {
    const {
      openAIApiKey,
      openAIOrgId,
      huggingfaceApiKey,
      cohereApiKey,
      anthropicApiKey,
      azureOpenAIApiKey,
      azureOpenAIApiInstanceName,
      azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion,
      azureOpenAIApiEmbeddingDeploymentName,
      googleApiKey,
      openRouterAiApiKey,
      embeddingModelKey,
      temperature,
      maxTokens,
      contextTurns,
      groqApiKey,
    } = sanitizeSettings(this.settings);
    return {
      openAIApiKey,
      openAIOrgId,
      huggingfaceApiKey,
      cohereApiKey,
      anthropicApiKey,
      groqApiKey,
      azureOpenAIApiKey,
      azureOpenAIApiInstanceName,
      azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion,
      azureOpenAIApiEmbeddingDeploymentName,
      googleApiKey,
      openRouterAiApiKey,
      modelKey: this.settings.defaultModelKey,
      embeddingModelKey: embeddingModelKey || DEFAULT_SETTINGS.embeddingModelKey,
      temperature: Number(temperature),
      maxTokens: Number(maxTokens),
      systemMessage: this.settings.userSystemPrompt || DEFAULT_SYSTEM_PROMPT,
      chatContextTurns: Number(contextTurns),
      chainType: ChainType.LLM_CHAIN, // Set LLM_CHAIN as default ChainType
      options: { forceNewCreation: true } as SetChainOptions,
      openAIProxyBaseUrl: this.settings.openAIProxyBaseUrl,
      openAIEmbeddingProxyBaseUrl: this.settings.openAIEmbeddingProxyBaseUrl,
    };
  }

  getLangChainParams(): LangChainParams {
    return this.getChainManagerParams();
  }

  getEncryptionService(): EncryptionService {
    return this.encryptionService;
  }

  async loadCopilotChatHistory() {
    const chatFiles = await this.getChatHistoryFiles();
    if (chatFiles.length === 0) {
      new Notice("未找到聊天历史记录");
      return;
    }
    new LoadChatHistoryModal(this.app, chatFiles, this.loadChatHistory.bind(this)).open();
  }

  async getChatHistoryFiles(): Promise<TFile[]> {
    const folder = this.app.vault.getAbstractFileByPath(this.settings.defaultSaveFolder);
    if (!(folder instanceof TFolder)) {
      return [];
    }
    const files = await this.app.vault.getMarkdownFiles();
    return files.filter((file) => file.path.startsWith(folder.path));
  }

  async loadChatHistory(file: TFile) {
    const content = await this.app.vault.read(file);
    const messages = this.parseChatContent(content);
    this.sharedState.clearChatHistory();
    messages.forEach((message) => this.sharedState.addMessage(message));

    // Check if the Copilot view is already active
    const existingView = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE)[0];
    if (!existingView) {
      // Only activate the view if it's not already open
      this.activateView();
    } else {
      // If the view is already open, just update its content
      const copilotView = existingView.view as CopilotView;
      copilotView.updateView();
    }
  }

  parseChatContent(content: string): ChatMessage[] {
    const lines = content.split("\n");
    const messages: ChatMessage[] = [];
    let currentSender = "";
    let currentMessage = "";

    for (const line of lines) {
      if (line.startsWith("**user**:") || line.startsWith("**ai**:")) {
        if (currentSender && currentMessage) {
          messages.push({
            sender: currentSender === USER_SENDER ? USER_SENDER : AI_SENDER,
            message: currentMessage.trim(),
            isVisible: true,
          });
        }
        currentSender = line.startsWith("**user**:") ? USER_SENDER : AI_SENDER;
        currentMessage = line.substring(line.indexOf(":") + 1).trim();
      } else {
        currentMessage += "\n" + line;
      }
    }

    if (currentSender && currentMessage) {
      messages.push({
        sender: currentSender === USER_SENDER ? USER_SENDER : AI_SENDER,
        message: currentMessage.trim(),
        isVisible: true,
      });
    }

    return messages;
  }

  getCurrentParagraph(): string {

    // Use getActiveViewOfType to obtain the current Markdown editor view.
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!markdownView) {
      console.log("No active Markdown view found.");
      return '';
    }

    const editor = markdownView.editor;

    // Obtain the cursor position.
    const cursor = editor.getCursor();
    const lineNumber = cursor.line;

    // Get all lines of the document.
    const allLines = editor.getValue().split('\n');

    // 查找当前段落
    let startLine = lineNumber;
    let endLine = lineNumber;

    // Search for the starting line of the paragraph upwards (an empty line or the beginning of the file indicates the start of a paragraph).
    while (startLine > 0 && allLines[startLine - 1].trim() !== '') {
      startLine--;
    }

    // Search for the ending line of the paragraph downwards (an empty line or the end of the file indicates the end of a paragraph).
    while (endLine < allLines.length - 1 && allLines[endLine + 1].trim() !== '') {
      endLine++;
    }

    // Get the content of a paragraph.
    const paragraph = allLines.slice(startLine, endLine + 1).join('\n');

    return paragraph

    // console.log("Current paragraph:", paragraph);
  }
}
