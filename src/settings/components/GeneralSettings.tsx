import { CustomModel, LangChainParams } from "@/aiParams";
import { ChatModelProviders } from "@/constants";
import EncryptionService from "@/encryptionService";
import React from "react";
import { useSettingsContext } from "../contexts/SettingsContext";
import CommandToggleSettings from "./CommandToggleSettings";
import {
  ModelSettingsComponent,
  SliderComponent,
  TextComponent,
  ToggleComponent,
} from "./SettingBlocks";

interface GeneralSettingsProps {
  getLangChainParams: () => LangChainParams;
  encryptionService: EncryptionService;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  getLangChainParams,
  encryptionService,
}) => {
  const { settings, updateSettings } = useSettingsContext();

  const handleUpdateModels = (models: Array<CustomModel>) => {
    const updatedActiveModels = models.map((model) => ({
      ...model,
      baseUrl: model.baseUrl || "",
      apiKey: model.apiKey || "",
    }));
    updateSettings({ activeModels: updatedActiveModels });
  };

  // modelKey is name | provider, e.g. "gpt-4o|openai"
  const onSetDefaultModelKey = (modelKey: string) => {
    updateSettings({ defaultModelKey: modelKey });
  };

  const onDeleteModel = (modelKey: string) => {
    const [modelName, provider] = modelKey.split("|");
    const updatedActiveModels = settings.activeModels.filter(
      (model) => !(model.name === modelName && model.provider === provider)
    );

    // Check if the deleted model was the default model
    let newDefaultModelKey = settings.defaultModelKey;
    if (modelKey === settings.defaultModelKey) {
      const newDefaultModel = updatedActiveModels.find((model) => model.enabled);
      if (newDefaultModel) {
        newDefaultModelKey = `${newDefaultModel.name}|${newDefaultModel.provider}`;
      } else {
        newDefaultModelKey = "";
      }
    }

    // Update both activeModels and defaultModelKey in a single operation
    updateSettings({
      activeModels: updatedActiveModels,
      defaultModelKey: newDefaultModelKey,
    });
  };

  return (
    <div>
      <h2>基础设置</h2>
      <ModelSettingsComponent
        activeModels={settings.activeModels}
        onUpdateModels={handleUpdateModels}
        providers={Object.values(ChatModelProviders)}
        onDeleteModel={onDeleteModel}
        defaultModelKey={settings.defaultModelKey}
        onSetDefaultModelKey={onSetDefaultModelKey}
        isEmbeddingModel={false}
      />
      <TextComponent
        name="会话信息存储路径"
        description="会话信息会保存在这个路径下，默认是 'copilot-conversations'"
        placeholder="copilot-conversations"
        value={settings.defaultSaveFolder}
        onChange={(value) => updateSettings({ defaultSaveFolder: value })}
      />
      <ToggleComponent
        name="自动保存会话信息"
        description="当新开启会话或重启插件时，自动保存之前的会话信息"
        value={settings.autosaveChat}
        onChange={(value) => updateSettings({ autosaveChat: value })}
      />
      <TextComponent
        name="自定义 Prompts 存储路径"
        description="自定义的 Prompts 存储会保存在这个路径下，默认是 'copilot-custom-prompts'"
        placeholder="copilot-custom-prompts"
        value={settings.customPromptsFolder}
        onChange={(value) => updateSettings({ customPromptsFolder: value })}
      />
      <h6>
        请格外注意这里设置的Tokens数量和会话次数，因为它们会影响API请求的成本
      </h6>
      <SliderComponent
        name="温度(Temperature)"
        description="默认是 0.1. 该值越高，回答的随机性越大；该值为0时，相同的输入内容，每一次都将得到相同的输出结果"
        min={0}
        max={2}
        step={0.05}
        value={settings.temperature}
        onChange={(value) => updateSettings({ temperature: value })}
      />
      <SliderComponent
        name="输出 Token 限制"
        description={
          <>
            <p>
              输出Token限制(<em>output tokens</em>); 默认 1000
            </p>
            <em>
              这里设置的数值加上 Prompt 消耗的tokens数，必须小于官方模型 max_tokens 的限制
            </em>
          </>
        }
        min={0}
        max={16000}
        step={100}
        value={settings.maxTokens}
        onChange={(value) => updateSettings({ maxTokens: value })}
      />
      <SliderComponent
        name="上下文会话次数"
        description="默认为15；即记住最新15次交互（30条消息）的上下文信息"
        min={1}
        max={50}
        step={1}
        value={settings.contextTurns}
        onChange={(value) => updateSettings({ contextTurns: value })}
      />
      <CommandToggleSettings
        enabledCommands={settings.enabledCommands}
        setEnabledCommands={(value) => updateSettings({ enabledCommands: value })}
      />
    </div>
  );
};

export default GeneralSettings;
