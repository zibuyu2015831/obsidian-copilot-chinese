import { DEFAULT_SYSTEM_PROMPT } from "@/constants";
import React from "react";
import { TextAreaComponent } from "./SettingBlocks";

interface AdvancedSettingsProps {
  userSystemPrompt: string;
  setUserSystemPrompt: (value: string) => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  userSystemPrompt,
  setUserSystemPrompt,
}) => {
  return (
    <div>
      <br />
      <br />
      <h1>高级设置</h1>
      <TextAreaComponent
        name="自定义系统 Prompt"
        description="提示: 该 Prompt 将在所有请求中携带！"
        value={userSystemPrompt}
        onChange={setUserSystemPrompt}
        placeholder={userSystemPrompt || "默认: " + DEFAULT_SYSTEM_PROMPT}
        rows={10}
      />
    </div>
  );
};

export default AdvancedSettings;
