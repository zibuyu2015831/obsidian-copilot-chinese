import { App, FuzzySuggestModal } from "obsidian";

interface Language {
  code: string;
  name: string;
}

var LANGUAGES = [
  { code: "en", name: "English", explain: "英语" },
  { code: "zh", name: "Chinese", explain: "汉语" },
  { code: "ja", name: "Japanese", explain: "日语" },
  { code: "ko", name: "Korean", explain: "韩语" },
  { code: "fr", name: "French", explain: "法语" },
  { code: "de", name: "German", explain: "德语" },
  { code: "ru", name: "Russian", explain: "俄语" },
  { code: "th", name: "Thai", explain: "泰语" },
  { code: "fi", name: "Finnish", explain: "芬兰语" },
  { code: "ms", name: "Malay", explain: "马来语" },
  { code: "nl", name: "Dutch", explain: "荷兰语" },
  { code: "no", name: "Norwegian", explain: "挪威语" },
  { code: "pl", name: "Polish", explain: "波兰语" },
  { code: "sv", name: "Swedish", explain: "瑞典语" },
  { code: "cs", name: "Czech", explain: "捷克语" },
  { code: "da", name: "Danish", explain: "丹麦语" },
  { code: "el", name: "Greek", explain: "希腊语" },
  { code: "vi", name: "Vietnamese", explain: "越南语" },
  { code: "fa", name: "Persian", explain: "波斯语" },
  { code: "is", name: "Icelandic", explain: "冰岛语" },
  { code: "zu", name: "Zulu", explain: "祖鲁语" },
  { code: "mn", name: "Mongolian", explain: "蒙古语" },
  { code: "es", name: "Spanish", explain: "西班牙语" },
  { code: "it", name: "Italian", explain: "意大利语" },
  { code: "pt", name: "Portuguese", explain: "葡萄牙语" },
  { code: "lt", name: "Lithuanian", explain: "立陶宛语" },
  { code: "ar", name: "Arabic", explain: "阿拉伯语" },
  { code: "bn", name: "Bengali", explain: "孟加拉语" },
  { code: "he", name: "Hebrew", explain: "希伯来语" },
  { code: "hi", name: "Hindi", explain: "北印度语" },
  { code: "hu", name: "Hungarian", explain: "匈牙利语" },
  { code: "tr", name: "Turkish", explain: "土耳其语" },
  { code: "uk", name: "Ukrainian", explain: "乌克兰语" },
  { code: "ta", name: "Tamil", explain: "泰米尔语" },
  { code: "te", name: "Telugu", explain: "泰卢固语" },
  { code: "ur", name: "Urdu", explain: "乌尔都语" },
  { code: "ne", name: "Nepali", explain: "尼泊尔语" },
  { code: "pa", name: "Punjabi", explain: "旁遮普语" },
  { code: "si", name: "Sinhala", explain: "僧伽罗语" },
  { code: "af", name: "Afrikaans", explain: "南非荷兰语" },
  { code: "bg", name: "Bulgarian", explain: "保加利亚语" },
  { code: "et", name: "Estonian", explain: "爱沙尼亚语" },
  { code: "fil", name: "Filipino", explain: "菲律宾语" },
  { code: "hr", name: "Croatian", explain: "克罗地亚语" },
  { code: "lv", name: "Latvian", explain: "拉脱维亚语" },
  { code: "ro", name: "Romanian", explain: "罗马尼亚语" },
  { code: "sk", name: "Slovak", explain: "斯洛伐克语" },
  { code: "sr", name: "Serbian", explain: "塞尔维亚语" },
  { code: "sw", name: "Swahili", explain: "斯瓦希里语" },
  { code: "ca", name: "Catalan", explain: "加泰罗尼亚语" },
  { code: "id", name: "Indonesian", explain: "印度尼西亚语" },
  { code: "sl", name: "Slovenian", explain: "斯洛文尼亚语" }
];

export class LanguageModal extends FuzzySuggestModal<Language> {
  private onChooseLanguage: (language: string) => void;

  constructor(app: App, onChooseLanguage: (language: string) => void) {
    super(app);
    this.onChooseLanguage = onChooseLanguage;
  }

  getItems(): Language[] {
    return LANGUAGES;
  }

  getItemText(language: Language): string {
    return language.explain;
  }

  onChooseItem(language: Language, evt: MouseEvent | KeyboardEvent) {
    this.onChooseLanguage(language.name);
  }
}
