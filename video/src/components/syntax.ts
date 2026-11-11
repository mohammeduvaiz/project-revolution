
import type { CODE_LANGUAGES } from "../../../shared/lesson-schema";

export type CodeLanguage = (typeof CODE_LANGUAGES)[number];
export type TokenKind = "plain" | "keyword" | "type" | "string" | "number" | "comment" | "preprocessor" | "punctuation";
export type Token = { text: string; kind: TokenKind };

type LanguageRules = { keywords: ReadonlySet<string>; types: ReadonlySet<string>; lineComment: string | null; caseInsensitive: boolean };

const set = (words: string): ReadonlySet<string> => new Set(words.split(/\s+/).filter(Boolean));

const RULES: Record<CodeLanguage, LanguageRules> = {
  c: {
    keywords: set("if else for while do switch case default break continue return goto sizeof typedef struct union enum static extern const volatile register auto"),
    types: set("int char float double void long short signed unsigned FILE size_t"),
    lineComment: "//",
    caseInsensitive: false,
  },
  python: {
    keywords: set("if elif else for while def return in not and or import from as class pass break continue lambda with try except finally raise yield True False None is global"),
    types: set("int str float list dict tuple set bool range print input len"),
    lineComment: "#",
    caseInsensitive: false,
  },
  java: {
    keywords: set("if else for while do switch case default break continue return new class public private protected static final void extends implements interface this super try catch finally throw throws import package"),
    types: set("int char float double boolean long short byte String Object"),
    lineComment: "//",
    caseInsensitive: false,
  },
  sql: {
    keywords: set("select from where insert into values update set delete create table drop alter primary key foreign references join inner left right on group by order having and or not null as distinct count sum avg min max"),
    types: set("int integer varchar char date decimal float text"),
    lineComment: "--",
    caseInsensitive: true,
  },
  text: { keywords: set(""), types: set(""), lineComment: null, caseInsensitive: false },
};

/** A small single-line tokenizer: enough to colour short teaching snippets, not a full parser. */
export const tokenizeLine = (line: string, language: CodeLanguage): Token[] => {
  const rules = RULES[language];
  if (language === "text") return [{ text: line, kind: "plain" }];
  if (language === "c" && /^\s*#/.test(line)) return [{ text: line, kind: "preprocessor" }];
  const tokens: Token[] = [];
  let i = 0;
  const push = (text: string, kind: TokenKind): void => {
    const last = tokens[tokens.length - 1];
    if (last && last.kind === kind && (kind === "plain" || kind === "punctuation")) last.text += text;
    else tokens.push({ text, kind });
  };
  while (i < line.length) {
    const rest = line.slice(i);
    if (rules.lineComment && rest.startsWith(rules.lineComment)) {
      push(rest, "comment");
      break;
    }
    if (rest.startsWith("/*") && language !== "python" && language !== "sql") {
      const end = rest.indexOf("*/", 2);
      const text = end === -1 ? rest : rest.slice(0, end + 2);
      push(text, "comment");
      i += text.length;
      continue;
    }
    const quote = rest[0];
    if (quote === '"' || quote === "'") {
      let j = 1;
      while (j < rest.length && rest[j] !== quote) j += rest[j] === "\\" ? 2 : 1;
      const text = rest.slice(0, j + 1);
      push(text, "string");
      i += text.length;
      continue;
    }
    const number = /^\d+(\.\d+)?/.exec(rest);
    if (number) {
      push(number[0], "number");
      i += number[0].length;
      continue;
    }
    const word = /^[A-Za-z_]\w*/.exec(rest);
    if (word) {
      const w = rules.caseInsensitive ? word[0].toLowerCase() : word[0];
      push(word[0], rules.keywords.has(w) ? "keyword" : rules.types.has(w) ? "type" : "plain");
      i += word[0].length;
      continue;
    }
    const ch = rest[0] ?? "";
    push(ch, /\s/.test(ch) ? "plain" : "punctuation");
    i += 1;
  }
  return tokens;
};

