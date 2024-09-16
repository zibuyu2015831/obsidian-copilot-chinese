import { CustomModel } from "@/aiParams";
import { EmbeddingModelProviders, VAULT_VECTOR_STORE_STRATEGIES } from "@/constants";
import { useSettingsContext } from "@/settings/contexts/SettingsContext";
import React from "react";
import { DropdownComponent, ModelSettingsComponent, SliderComponent } from "./SettingBlocks";

interface QASettingsProps {
  huggingfaceApiKey: string;
  setHuggingfaceApiKey: (value: string) => void;
  indexVaultToVectorStore: string;
  setIndexVaultToVectorStore: (value: string) => void;
  maxSourceChunks: number;
  setMaxSourceChunks: (value: number) => void;
}

const QASettings: React.FC<QASettingsProps> = ({
  indexVaultToVectorStore,
  setIndexVaultToVectorStore,
  maxSourceChunks,
  setMaxSourceChunks,
}) => {
  const { settings, updateSettings } = useSettingsContext();

  const handleUpdateEmbeddingModels = (models: Array<CustomModel>) => {
    const updatedActiveEmbeddingModels = models.map((model) => ({
      ...model,
      baseUrl: model.baseUrl || "",
      apiKey: model.apiKey || "",
    }));
    updateSettings({ activeEmbeddingModels: updatedActiveEmbeddingModels });
  };

  const handleSetEmbeddingModelKey = (modelKey: string) => {
    updateSettings({ embeddingModelKey: modelKey });
  };

  return (
    <div>
      <br />
      <br />
      <h1>QA 设置</h1>
      <div className="warning-message">
        QA 模式目前是测试版，可能不稳定，如有问题可到github上提交issues
      </div>
      <p>
        QA 模式将生成一个本地的向量索引文件
      </p>
      <h2>Long Note QA vs. Vault QA (BETA)</h2>
      <p>
        Long Note QA 模式将使用当前笔记作为上下文信息，QA (BETA)模式将使用所有笔记作为上下文；
        为获得更好的回复效果，向AI询问时请尽量具体
      </p>
      <h2>本地 Embedding 模型</h2>
      <p>
        可查阅{" "}
        <a href="https://github.com/logancyang/obsidian-copilot/blob/master/local_copilot.md">
          local copilot
        </a>{" "}
        获知如何设置 Ollama's 本地 embedding 模型 (要求 Ollama v0.1.26 或以上).
      </p>
      <h2>Embedding 模型</h2>
      <ModelSettingsComponent
        activeModels={settings.activeEmbeddingModels}
        onUpdateModels={handleUpdateEmbeddingModels}
        providers={Object.values(EmbeddingModelProviders)}
        onDeleteModel={(modelKey) => {
          const updatedActiveEmbeddingModels = settings.activeEmbeddingModels.filter(
            (model) => `${model.name}|${model.provider}` !== modelKey
          );
          updateSettings({ activeEmbeddingModels: updatedActiveEmbeddingModels });
        }}
        defaultModelKey={settings.embeddingModelKey}
        onSetDefaultModelKey={handleSetEmbeddingModelKey}
        isEmbeddingModel={true}
      />
      <h1>Auto-Index 策略</h1>
      <div className="warning-message">
        如果您使用付费的embedding，笔记量大时，将非常消耗成本!
      </div>
      <p>
        当你切换到<strong>Long Note QA</strong>模式时，当前笔记的向量索引将自动创建
        <br />
        当您切换到<strong> QA </strong>模式时，将根据上面设置的【Auto-index 策略】建立向量索引
        <br />
      </p>
      <DropdownComponent
        name="Auto-index 策略"
        description="设置何时建立向量索引"
        value={indexVaultToVectorStore}
        onChange={setIndexVaultToVectorStore}
        options={VAULT_VECTOR_STORE_STRATEGIES}
      />
      <br />
      <p>
        设置为 <strong>NEVER</strong>: 笔记不会被索引到向量存储中，除非用户主动运行命令 <em>Index vault for QA</em> , 或点击 <em>Refresh Index</em> 按钮.
        <br />
        <br />
        设置为 <strong>ON STARTUP</strong>: 插件加载/重载时，向量存储会被刷新。
        <br />
        <br />
        设置为 <strong>ON MODE SWITCH (Recommended)</strong>: 切换到 Vault QA 模式时，向量存储会被刷新。
        <br />
        <br />
        “刷新”并不意味着向量索引从头重建，而是根新增或修改的笔记进行增量更新，这有助于降低使用付费 embedding 模型的成本。
        <br />
        <br />
        如果需要完全重建，请手动运行“Clear vector store”和“Force re-index for QA”命令。
        <br />
        <br />
        如果你使用付费 embedding 模型并且笔记量比较大，请注意成本！可以运行命令 <em>Count total tokens in your vault</em> 并参考所选 embedding 模型的定价来估算索引成本。
      </p>
      <br />
      <SliderComponent
        name="Max Sources"
        description="默认值是 3（推荐）。如果你希望从笔记中获取更多来源，可以增加这个值。较高的数字可能导致不相关的来源和较低质量的响应，同时也会更快地填满上下文窗口。"
        min={1}
        max={10}
        step={1}
        value={maxSourceChunks}
        onChange={async (value) => {
          setMaxSourceChunks(value);
        }}
      />
    </div>
  );
};

export default QASettings;
