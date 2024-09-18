import { App, Modal } from "obsidian";

export class AdhocPromptModal extends Modal {
  result: string;
  onSubmit: (result: string) => void;

  private placeholderText = "输入内容后回车，即可开启AI会话";

  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

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
    contentEl.appendChild(promptDescFragment);

    const textareaEl = contentEl.createEl("textarea", {
      attr: { placeholder: this.placeholderText },
    });
    textareaEl.style.width = "100%";
    textareaEl.style.height = "100px"; // Set the desired height
    textareaEl.style.padding = "10px";
    textareaEl.style.resize = "vertical"; // Allow vertical resizing

    textareaEl.addEventListener("input", (evt) => {
      this.result = (evt.target as HTMLTextAreaElement).value;
    });

    textareaEl.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" && !evt.shiftKey) {
        evt.preventDefault(); // Prevent line break unless Shift key is pressed
        this.close();
        this.onSubmit(this.result);
      }
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
