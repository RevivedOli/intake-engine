export type LayoutVariant = "centered" | "left" | "full-width";

export interface AppTheme {
  /** Primary brand colour (buttons, links, accents) */
  primaryColor?: string;
  /** Background colour or image URL */
  background?: string;
  /** Font family (CSS value or Tailwind font class) */
  fontFamily?: string;
  /** Layout of question/content area */
  layout?: LayoutVariant;
  /** Optional overrides for question card, button, etc. */
  questionCardStyle?: Record<string, string>;
  buttonStyle?: Record<string, string>;
}
