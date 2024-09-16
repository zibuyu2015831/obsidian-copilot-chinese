import React from "react";
import ApiSetting from "./ApiSetting";
import Collapsible from "./Collapsible";

interface ApiSettingsProps {
  openAIApiKey: string;
  setOpenAIApiKey: (value: string) => void;
  openAIOrgId: string;
  setOpenAIOrgId: (value: string) => void;
  googleApiKey: string;
  setGoogleApiKey: (value: string) => void;
  anthropicApiKey: string;
  setAnthropicApiKey: (value: string) => void;
  openRouterAiApiKey: string;
  setOpenRouterAiApiKey: (value: string) => void;
  azureOpenAIApiKey: string;
  setAzureOpenAIApiKey: (value: string) => void;
  azureOpenAIApiInstanceName: string;
  setAzureOpenAIApiInstanceName: (value: string) => void;
  azureOpenAIApiDeploymentName: string;
  setAzureOpenAIApiDeploymentName: (value: string) => void;
  azureOpenAIApiVersion: string;
  setAzureOpenAIApiVersion: (value: string) => void;
  azureOpenAIApiEmbeddingDeploymentName: string;
  setAzureOpenAIApiEmbeddingDeploymentName: (value: string) => void;
  groqApiKey: string;
  setGroqApiKey: (value: string) => void;
  cohereApiKey: string;
  setCohereApiKey: (value: string) => void;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({
  openAIApiKey,
  setOpenAIApiKey,
  openAIOrgId,
  setOpenAIOrgId,
  googleApiKey,
  setGoogleApiKey,
  anthropicApiKey,
  setAnthropicApiKey,
  openRouterAiApiKey,
  setOpenRouterAiApiKey,
  azureOpenAIApiKey,
  setAzureOpenAIApiKey,
  azureOpenAIApiInstanceName,
  setAzureOpenAIApiInstanceName,
  azureOpenAIApiDeploymentName,
  setAzureOpenAIApiDeploymentName,
  azureOpenAIApiVersion,
  setAzureOpenAIApiVersion,
  azureOpenAIApiEmbeddingDeploymentName,
  setAzureOpenAIApiEmbeddingDeploymentName,
  groqApiKey,
  setGroqApiKey,
  cohereApiKey,
  setCohereApiKey,
}) => {
  return (
    <div>
      <br />
      <br />
      <h1>API 设置</h1>
      <p>所有的 API keys 仅保存在本地</p>
      <div className="warning-message">
        请确保输入正确的API Key，并确保具有模型访问权限！
        <br />
        如果出现失败，可以尝试重新输入 API key 后保存并重启插件！
      </div>
      <div>
        <div>
          <ApiSetting
            title="OpenAI API Key"
            value={openAIApiKey}
            setValue={setOpenAIApiKey}
            placeholder="请输入 OpenAI API Key"
          />
          <p>
            可以在这里获取你的 API key -&gt;{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://platform.openai.com/api-keys
            </a>
          </p>
          <ApiSetting
            title="OpenAI Organization ID (optional)"
            value={openAIOrgId}
            setValue={setOpenAIOrgId}
            placeholder="请输入 OpenAI 的 Organization ID"
          />
        </div>
        <div className="warning-message">
          <span>如果你是新手，可以先到  -&gt;{" "}</span>
          <a
            href="https://platform.openai.com/playground?mode=chat"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenAI playground
          </a>
          <span>查看你是否具有访问权限</span>
        </div>
      </div>
      <br />
      <Collapsible title="Google API 设置">
        <div>
          <ApiSetting
            title="Google API Key"
            value={googleApiKey}
            setValue={setGoogleApiKey}
            placeholder="请输入 Google API Key"
          />
          <p>
            如果你有 Google Cloud 账户，可以从这里获取 Gemini API 密钥 -&gt;{" "}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
            >
              点击跳转
            </a>
            ；
            <br />
            你的 API 密钥存储在本地，只用于向 Google 的服务发送请求
          </p>
        </div>
      </Collapsible>

      <Collapsible title="Anthropic API 设置">
        <div>
          <ApiSetting
            title="Anthropic API Key"
            value={anthropicApiKey}
            setValue={setAnthropicApiKey}
            placeholder="请输入 Anthropic API Key"
          />
          <p>
            如果你有 Anthropic API 访问权限, 可以从这里获取密钥 -&gt;{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              点击跳转 
            </a>
            ；
            <br />
            你的 API 密钥存储在本地，只用于向 Anthropic 的服务发送请求。
          </p>
        </div>
      </Collapsible>

      <Collapsible title="OpenRouter.ai API 设置">
        <div>
          <ApiSetting
            title="OpenRouter AI API Key"
            value={openRouterAiApiKey}
            setValue={setOpenRouterAiApiKey}
            placeholder="请输入 OpenRouter AI API Key"
          />
          <p>
            可以从这里获取 OpenRouterA 密钥 -&gt;{" "}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
            </a>
            点击跳转
            <br />
            模型设置 -&gt;{" "}
            <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer">
              点击跳转
            </a>
            
          </p>
        </div>
      </Collapsible>

      <Collapsible title="Azure OpenAI API 设置">
        <div>
          <ApiSetting
            title="Azure OpenAI API Key"
            value={azureOpenAIApiKey}
            setValue={setAzureOpenAIApiKey}
            placeholder="请输入 Azure OpenAI API Key"
          />
          <ApiSetting
            title="Azure OpenAI API 实例名称"
            value={azureOpenAIApiInstanceName}
            setValue={setAzureOpenAIApiInstanceName}
            placeholder="请输入 Azure OpenAI API 实例名称"
            type="text"
          />
          <ApiSetting
            title="Azure OpenAI API 部署名称"
            description="这是你的实际模型，无需单独传递模型名称。"
            value={azureOpenAIApiDeploymentName}
            setValue={setAzureOpenAIApiDeploymentName}
            placeholder="请输入 Azure OpenAI API 部署名称"
            type="text"
          />
          <ApiSetting
            title="Azure OpenAI API 版本"
            value={azureOpenAIApiVersion}
            setValue={setAzureOpenAIApiVersion}
            placeholder="请输入 Azure OpenAI API 的版本"
            type="text"
          />
          <ApiSetting
            title="Azure OpenAI API Embedding 部署名称"
            description="(可选) For embedding provider Azure OpenAI"
            value={azureOpenAIApiEmbeddingDeploymentName}
            setValue={setAzureOpenAIApiEmbeddingDeploymentName}
            placeholder="请输入 Azure OpenAI API Embedding 部署名称"
            type="text"
          />
        </div>
      </Collapsible>

      <Collapsible title="Groq API 设置">
        <div>
          <ApiSetting
            title="Groq API Key"
            value={groqApiKey}
            setValue={setGroqApiKey}
            placeholder="请输入 Groq API Key"
          />
          <p>
            如果具有 Groq API 访问权限, 可以从这里获取密钥 -&gt;{" "}
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
              点击跳转
            </a>
            ；
            <br />
            你的API密钥存储在本地，仅用于向Groq的服务发起请求。
          </p>
        </div>
      </Collapsible>

      <Collapsible title="Cohere API 设置">
        <ApiSetting
          title="Cohere API Key"
          value={cohereApiKey}
          setValue={setCohereApiKey}
          placeholder="请输入 Cohere API Key"
        />
        <p>
          可以从这里获取密钥 -&gt;{" "}
          <a href="https://dashboard.cohere.ai/api-keys" target="_blank" rel="noreferrer">
            点击跳转
          </a>
        </p>
      </Collapsible>
    </div>
  );
};

export default ApiSettings;
