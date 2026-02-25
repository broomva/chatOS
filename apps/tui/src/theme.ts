import type { EditorTheme, MarkdownTheme, SelectListTheme } from "@mariozechner/pi-tui";
import chalk from "chalk";

export const selectListTheme: SelectListTheme = {
  selectedPrefix: (text: string) => chalk.cyan(text),
  selectedText: (text: string) => chalk.white.bold(text),
  description: (text: string) => chalk.gray(text),
  scrollInfo: (text: string) => chalk.dim(text),
  noMatch: (text: string) => chalk.yellow(text),
};

export const editorTheme: EditorTheme = {
  borderColor: (text: string) => chalk.gray(text),
  selectList: selectListTheme,
};

export const markdownTheme: MarkdownTheme = {
  heading: (text: string) => chalk.cyan.bold(text),
  link: (text: string) => chalk.blue.underline(text),
  linkUrl: (text: string) => chalk.dim(text),
  code: (text: string) => chalk.yellow(text),
  codeBlock: (text: string) => chalk.green(text),
  codeBlockBorder: (text: string) => chalk.dim(text),
  quote: (text: string) => chalk.italic(text),
  quoteBorder: (text: string) => chalk.dim(text),
  hr: (text: string) => chalk.dim(text),
  listBullet: (text: string) => chalk.cyan(text),
  bold: (text: string) => chalk.bold(text),
  italic: (text: string) => chalk.italic(text),
  strikethrough: (text: string) => chalk.strikethrough(text),
  underline: (text: string) => chalk.underline(text),
};

export const colors = {
  header: (text: string) => chalk.bgCyan.black(text),
  headerDim: (text: string) => chalk.bgCyan.black.dim(text),
  statusBar: (text: string) => chalk.bgGray.white(text),
  statusKey: (text: string) => chalk.bgGray.cyan(text),
  userLabel: (text: string) => chalk.blue.bold(text),
  assistantLabel: (text: string) => chalk.green.bold(text),
  systemLabel: (text: string) => chalk.yellow.bold(text),
  dim: (text: string) => chalk.dim(text),
  error: (text: string) => chalk.red(text),
  success: (text: string) => chalk.green(text),
  info: (text: string) => chalk.cyan(text),
};
