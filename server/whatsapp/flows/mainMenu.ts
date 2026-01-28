// Main Menu Flow Handler
import type { ChatbotTranslations } from "../translations";

/**
 * Generate main menu message
 */
export function handleMainMenu(t: ChatbotTranslations): string {
  return `${t.mainMenuTitle}\n\n${t.mainMenuOptions.join("\n")}`;
}

/**
 * Generate welcome message with menu
 */
export function handleWelcome(t: ChatbotTranslations, isReturning: boolean = false): string {
  const greeting = isReturning ? t.welcomeBack : t.welcome;
  return `${greeting}\n\n${handleMainMenu(t)}`;
}
