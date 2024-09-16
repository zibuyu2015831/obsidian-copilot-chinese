import { App, FuzzySuggestModal } from "obsidian";

var TONES = [
  { prompt: "You have excellent text analysis skills, allowing you to quickly identify mechanical expressions. With a rich vocabulary and strong command of rhetoric, you can naturally and fluently restructure sentences according to the context. Please help me refine the following text to make it more aligned with a human writing style, while ensuring the information remains accurate and clear, without introducing any ambiguity.", name: "去除AI痕迹" },
    { prompt: "Please insert appropriate emojis to the following content without changing the text. Insert at as many places as possible, but don't have any 2 emojis together. The original text must be returned.", name: "添加emoji表情" },
  { prompt: "Please rewrite the input text in a professional style. Use formal and precise language, maintain objectivity, and ensure the information is conveyed accurately. The tone should be suitable for formal contexts.", name: "专业" },
  { prompt: "Please rewrite the input text in a casual style. Use a relaxed and conversational tone with natural expressions. The content should feel approachable and easy to understand, suitable for everyday communication.", name: "休闲" },
  { prompt: "Please rewrite the input text in a concise style. Simplify the message, removing unnecessary details, and deliver the core information directly. Ensure the expression is clear and to the point, avoiding complex sentence structures.", name: "简明" },
  { prompt: "Please rewrite the input text in a confident style. Use strong, assertive language and convey a sense of authority and decisiveness. The tone should inspire trust and demonstrate professionalism.", name: "自信" },
  { prompt: "Please rewrite the input text in a friendly style. Use warm and approachable language, showing empathy and care. The tone should make the reader feel understood and respected, ideal for creating positive relationships.", name: "友好" },
  { prompt: "Please rewrite the following text to make it sound like a press release.", name: "新闻稿风格" }
];

export class ToneModal extends FuzzySuggestModal<string> {
  private onChooseTone: (tone: string) => void;

  constructor(app: App, onChooseTone: (tone: string) => void) {
    super(app);
    this.onChooseTone = onChooseTone;
  }

  getItems(): any {
    return TONES;
  }

  getItemText(tone: any): string {
    return tone.name;
  }

  onChooseItem(tone:any, evt:any) {
    this.onChooseTone(tone.prompt);
  }
}
