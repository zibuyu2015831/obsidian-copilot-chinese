import { CustomModel } from "@/aiParams";
import CopilotView from "@/components/CopilotView";
import { CHAT_VIEWTYPE } from "@/constants";
import CopilotPlugin from "@/main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import React from "react";
import { createRoot } from "react-dom/client";
import SettingsMain from "./components/SettingsMain";
import { SettingsProvider } from "./contexts/SettingsContext";

export interface CopilotSettings {
  openAIApiKey: string;
  openAIOrgId: string;
  huggingfaceApiKey: string;
  cohereApiKey: string;
  anthropicApiKey: string;
  azureOpenAIApiKey: string;
  azureOpenAIApiInstanceName: string;
  azureOpenAIApiDeploymentName: string;
  azureOpenAIApiVersion: string;
  azureOpenAIApiEmbeddingDeploymentName: string;
  googleApiKey: string;
  openRouterAiApiKey: string;
  defaultModelKey: string;
  embeddingModelKey: string;
  temperature: number;
  maxTokens: number;
  contextTurns: number;
  userSystemPrompt: string;
  openAIProxyBaseUrl: string;
  openAIEmbeddingProxyBaseUrl: string;
  stream: boolean;
  defaultSaveFolder: string;
  autosaveChat: boolean;
  customPromptsFolder: string;
  indexVaultToVectorStore: string;
  chatNoteContextPath: string;
  chatNoteContextTags: string[];
  debug: boolean;
  enableEncryption: boolean;
  maxSourceChunks: number;
  qaExclusionPaths: string;
  groqApiKey: string;
  enabledCommands: Record<string, { enabled: boolean; name: string; icon: string }>;
  activeModels: Array<CustomModel>;
  activeEmbeddingModels: Array<CustomModel>;
}

export class CopilotSettingTab extends PluginSettingTab {
  plugin: CopilotPlugin;

  constructor(app: App, plugin: CopilotPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async reloadPlugin() {
    try {
      // Save the settings before reloading
      await this.plugin.saveSettings();

      // Autosave the current chat before reloading
      const chatView = this.app.workspace.getLeavesOfType(CHAT_VIEWTYPE)[0]?.view as CopilotView;
      if (chatView && this.plugin.settings.autosaveChat) {
        await this.plugin.autosaveCurrentChat();
      }

      // Reload the plugin
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const app = this.plugin.app as any;
      await app.plugins.disablePlugin("copilot-chinese");
      await app.plugins.enablePlugin("copilot-chinese");

      app.setting.openTabById("copilot-chinese").display();
      new Notice("插件重启成功");
    } catch (error) {
      new Notice("插件重启失败，请手动重启插件");
      console.error("插件重启失败:", error);
    }
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.style.userSelect = "text";
    const div = containerEl.createDiv("div");
    const sections = createRoot(div);

    sections.render(
      <SettingsProvider plugin={this.plugin} reloadPlugin={this.reloadPlugin.bind(this)}>
        <SettingsMain plugin={this.plugin} reloadPlugin={this.reloadPlugin.bind(this)} />
      </SettingsProvider>
    );

    const devModeHeader = containerEl.createEl("h1", { text: "额外设置" });
    devModeHeader.style.marginTop = "40px";

    new Setting(containerEl)
      .setName("是否加密")
      .setDesc(
        createFragment((frag) => {
          frag.appendText("存储 API keys 时进行加密");
        })
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableEncryption).onChange(async (value) => {
          this.plugin.settings.enableEncryption = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("调试模式")
      .setDesc(
        createFragment((frag) => {
          frag.appendText("开启调试模式，将在终端交互窗口输出所有API请求信息");
        })
      )
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.debug).onChange(async (value) => {
          this.plugin.settings.debug = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
