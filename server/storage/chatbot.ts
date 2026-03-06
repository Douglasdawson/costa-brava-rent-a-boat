import {
  db, eq, sql,
  chatbotConversations,
  type ChatbotConversation, type InsertChatbotConversation, type UpdateChatbotConversation,
} from "./base";

export async function getChatbotConversation(phoneNumber: string): Promise<ChatbotConversation | undefined> {
  const [conversation] = await db
    .select()
    .from(chatbotConversations)
    .where(eq(chatbotConversations.phoneNumber, phoneNumber));
  return conversation || undefined;
}

export async function createChatbotConversation(conversation: InsertChatbotConversation): Promise<ChatbotConversation> {
  const [newConversation] = await db
    .insert(chatbotConversations)
    .values(conversation)
    .returning();
  return newConversation;
}

export async function updateChatbotConversation(
  phoneNumber: string,
  updates: UpdateChatbotConversation
): Promise<ChatbotConversation | undefined> {
  const [conversation] = await db
    .update(chatbotConversations)
    .set({
      ...updates,
      lastMessageAt: new Date(),
      messagesCount: sql`messages_count + 1`,
    })
    .where(eq(chatbotConversations.phoneNumber, phoneNumber))
    .returning();
  return conversation || undefined;
}

export async function resetChatbotConversation(phoneNumber: string): Promise<ChatbotConversation | undefined> {
  const [conversation] = await db
    .update(chatbotConversations)
    .set({
      currentState: 'welcome',
      selectedBoatId: null,
      selectedDate: null,
      selectedStartTime: null,
      selectedDuration: null,
      selectedExtras: null,
      customerName: null,
      customerEmail: null,
      numberOfPeople: null,
      context: {},
      lastMessageAt: new Date(),
    })
    .where(eq(chatbotConversations.phoneNumber, phoneNumber))
    .returning();
  return conversation || undefined;
}

export async function getOrCreateChatbotConversation(
  phoneNumber: string,
  language: string = 'es'
): Promise<ChatbotConversation> {
  let conversation = await getChatbotConversation(phoneNumber);

  if (!conversation) {
    conversation = await createChatbotConversation({
      phoneNumber,
      language,
      currentState: 'welcome',
    });
  }

  return conversation;
}
