import { CopilotSettings } from "@/settings/SettingsPage";
import { App, Modal } from "obsidian";

export class ChatNoteContextModal extends Modal {
  private settings: CopilotSettings;
  private onSubmit: (path: string, tags: string[]) => void;

  constructor(
    app: App,
    settings: CopilotSettings,
    onSubmit: (path: string, tags: string[]) => void
  ) {
    super(app);
    this.settings = settings;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const formContainer = this.contentEl.createEl("div", { cls: "copilot-command-modal" });
    const pathContainer = formContainer.createEl("div", { cls: "copilot-command-input-container" });

    pathContainer.createEl("h3", { text: "通过路径筛选", cls: "copilot-command-header" });
    const descFragment = createFragment((frag) => {
      frag.createEl("strong", { text: "在聊天框中点击【发送笔记】时，" });
      frag.appendText("该路径下的所有笔记将被发送；");
      frag.appendText("如果没有提供， ");
      frag.createEl("strong", { text: "则默认使用当前被激活的笔记" });
    });
    pathContainer.appendChild(descFragment);

    const pathField = pathContainer.createEl("input", {
      type: "text",
      cls: "copilot-command-input",
      value: this.settings.chatNoteContextPath,
    });
    pathField.setAttribute("name", "folderPath");

    pathContainer.createEl("h3", { text: "通过标签进行筛选", cls: "copilot-command-header" });
    const descTagsFragment = createFragment((frag) => {
      frag.createEl("strong", {
        text: "仅使用笔记属性中的标签，不使用笔记内容中的标签。",
      });
      frag.createEl("p", {
        text: "上述路径的所有笔记都由指定标签进一步筛选。如果没有提供路径，则仅使用标签。多个标签应以逗号分隔。",
      });
      frag.createEl("strong", { text: "标签起到“或”过滤器的作用，" });
      frag.appendText(
        "在聊天模式下点击按钮时，任何与其中一个标签匹配的笔记都会发送到提示框中。"
      );
    });
    pathContainer.appendChild(descTagsFragment);

    const tagsField = pathContainer.createEl("input", {
      type: "text",
      cls: "copilot-command-input",
      value: this.settings.chatNoteContextTags.join(","),
    });
    tagsField.setAttribute("name", "tags");

    const submitButtonContainer = formContainer.createEl("div", {
      cls: "copilot-command-save-btn-container",
    });
    const submitButton = submitButtonContainer.createEl("button", {
      text: "Submit",
      cls: "copilot-command-save-btn",
    });

    submitButton.addEventListener("click", () => {
      // Remove the leading slash if it exists
      let pathValue = pathField.value;
      if (pathValue.startsWith("/") && pathValue.length > 1) {
        pathValue = pathValue.slice(1);
      }

      const tagsValue = tagsField.value
        .split(",")
        .map((tag) => tag.trim())
        .map((tag) => tag.toLowerCase())
        .map((tag) => tag.replace("#", ""))
        .filter((tag) => tag !== "");

      this.onSubmit(pathValue, tagsValue);
      this.close();
    });
  }
}
