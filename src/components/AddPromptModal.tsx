import { App, Modal, Notice } from "obsidian";

export class AddPromptModal extends Modal {
  constructor(
    app: App,
    onSave: (title: string, prompt: string) => void,
    initialTitle = "",
    initialPrompt = "",
    disabledTitle?: boolean
  ) {
    super(app);

    this.contentEl.createEl("h2", { text: "自定义 Prompt" });

    const formContainer = this.contentEl.createEl("div", { cls: "copilot-command-modal" });

    const titleContainer = formContainer.createEl("div", {
      cls: "copilot-command-input-container",
    });

    titleContainer.createEl("h3", { text: "标题", cls: "copilot-command-header" });
    titleContainer.createEl("p", {
      text: "请确保标题不要重复",
      cls: "copilot-command-input-description",
    });

    const titleField = titleContainer.createEl("input", { type: "text" });
    if (disabledTitle) {
      titleField.setAttribute("disabled", "true");
    }
    if (initialTitle) {
      titleField.value = initialTitle;
    }

    const promptContainer = formContainer.createEl("div", {
      cls: "copilot-command-input-container",
    });

    promptContainer.createEl("h3", { text: "Prompt", cls: "copilot-command-header" });

    const promptDescFragment = createFragment((frag) => {
      frag.createEl("strong", { text: "- {} 表示选中的文本（可选）；" });
      frag.createEl("br");
      frag.createEl("strong", { text: "- {[[笔记标题]]} 表示一条笔记； " });
      frag.createEl("br");
      frag.createEl("strong", { text: "- {activeNote} 表示当前笔记；" });
      frag.createEl("br");
      frag.createEl("strong", { text: "- {FolderPath} 表示某个路径下所有笔记； " });
      frag.createEl("br");
      frag.createEl("strong", {
        text: "- {#tag1, #tag2} 表示包含tag1，tag2的所有笔记；",
      });
      frag.createEl("br");
      frag.createEl("br");
      frag.appendText("提示: 可打开调试模式，在会话窗口查看；");
      frag.createEl("br");
      frag.createEl("br");
    });
    promptContainer.appendChild(promptDescFragment);

    const promptField = promptContainer.createEl("textarea");
    if (initialPrompt) {
      promptField.value = initialPrompt;
    }

    const descFragment = createFragment((frag) => {
      frag.appendText(
        "保存Prompt后，可以通过在命令窗口中输入"
      );
      frag.createEl("strong", { text: "【应用自定义 prompt】进行选择" });
      frag.createEl("br");
      frag.appendText("点击 ");
      frag
        .createEl("a", {
          href: "https://github.com/f/awesome-chatgpt-prompts",
          text: "awesome chatGPT prompts",
        })
        .setAttr("target", "_blank");
      frag.appendText(" 查看优秀prompt.");
    });

    const descContainer = promptContainer.createEl("p", {
      cls: "copilot-command-input-description",
    });

    descContainer.appendChild(descFragment);

    const saveButtonContainer = formContainer.createEl("div", {
      cls: "copilot-command-save-btn-container",
    });
    const saveButton = saveButtonContainer.createEl("button", {
      text: "保存",
      cls: "copilot-command-save-btn",
    });
    saveButton.addEventListener("click", () => {
      if (titleField.value && promptField.value) {
        onSave(titleField.value, promptField.value);
        this.close();
      } else {
        new Notice("请完成必填项: 标题 and Prompt.");
      }
    });
  }
}
