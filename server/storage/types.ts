import type {
  Tenant, InsertTenant, UpdateTenant,
  SaasUser, InsertUser, RefreshToken, PasswordResetToken,
  AdminUser, InsertAdminUser,
  CustomerUser, UpsertCustomerUser,
  Customer, InsertCustomer,
  Boat, InsertBoat,
  Booking, InsertBooking,
  BookingExtra, InsertBookingExtra,
  Testimonial, InsertTestimonial,
  BlogPost, InsertBlogPost,
  Destination, InsertDestination,
  ChatbotConversation, InsertChatbotConversation, UpdateChatbotConversation,
  ClientPhoto, InsertClientPhoto,
  GiftCard, InsertGiftCard,
  DiscountCode, InsertDiscountCode,
  CrmCustomer, UpdateCrmCustomer,
  Checkin, InsertCheckin,
  MaintenanceLog, InsertMaintenanceLog, UpdateMaintenanceLog,
  BoatDocument, InsertBoatDocument, UpdateBoatDocument,
  InventoryItem, InsertInventoryItem, UpdateInventoryItem,
  InventoryMovement, InsertInventoryMovement,
  NewsletterSubscriber,
  WhatsappInquiry, InsertWhatsappInquiry, UpdateWhatsappInquiry,
} from "@shared/schema";
import type { SocialProofBooking } from "./bookings";

export interface IStorage {
  // Tenant methods
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(data: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, data: UpdateTenant): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  seedDefaultTenant(): Promise<Tenant>;

  // SaaS User methods
  getUserById(id: string): Promise<SaasUser | undefined>;
  getUserByEmail(email: string, tenantId: string): Promise<SaasUser | undefined>;
  getUsersByTenant(tenantId: string): Promise<SaasUser[]>;
  createUser(data: InsertUser): Promise<SaasUser>;
  updateUser(id: string, data: Partial<SaasUser>): Promise<SaasUser | undefined>;

  // Refresh token methods
  createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;
  getRefreshToken(token: string): Promise<RefreshToken | undefined>;
  deleteRefreshToken(token: string): Promise<boolean>;
  deleteUserRefreshTokens(userId: string): Promise<void>;
  cleanupExpiredRefreshTokens(): Promise<number>;

  // Password reset token methods
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;

  // Migration
  migrateAdminUsersToUsers(tenantId: string): Promise<{ migrated: number; skipped: number }>;

  // Admin session persistence
  createAdminSession(token: string, userId: string, role: string, username: string, expiresAt: Date): Promise<void>;
  deleteAdminSession(token: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
  blacklistToken(token: string, expiresAt: Date): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // Admin User methods
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser | undefined>;
  getAllAdminUsers(): Promise<AdminUser[]>;

  // Customer User methods
  getCustomerUser(id: string): Promise<CustomerUser | undefined>;
  upsertCustomerUser(user: UpsertCustomerUser): Promise<CustomerUser>;

  // Customer Profile methods
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByUserId(userId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Boat methods
  getAllBoats(): Promise<Boat[]>;
  getBoat(id: string): Promise<Boat | undefined>;
  createBoat(boat: InsertBoat): Promise<Boat>;
  updateBoat(id: string, boat: Partial<InsertBoat>): Promise<Boat | undefined>;

  // Booking methods
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingById(id: string): Promise<Booking | undefined>;
  getBookingsByDate(date: Date): Promise<Booking[]>;
  getBookingsByBoatAndDateRange(boatId: string, startDate: Date, endDate: Date): Promise<Booking[]>;
  updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined>;
  updateBookingPaymentStatus(id: string, status: string, stripePaymentIntentId?: string): Promise<Booking | undefined>;
  updateBookingWhatsAppStatus(id: string, confirmationSent?: boolean, reminderSent?: boolean): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  getConfirmedBookings(): Promise<Booking[]>;
  getConfirmedBookingsWithEmail(): Promise<Booking[]>;
  getBookingsByCustomer(customerId: string, email: string | null, phone: string | null): Promise<Booking[]>;
  getBookingByCancelationToken(token: string): Promise<Booking | undefined>;
  cancelBookingByToken(token: string): Promise<{ booking: Booking; refundAmount: number; refundPercentage: number } | undefined>;
  getPaginatedBookings(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{ data: Booking[]; total: number; page: number; totalPages: number }>;
  getBookingsForCalendar(params: { startDate: Date; endDate: Date; boatId?: string }): Promise<Booking[]>;
  createBookingExtra(extra: InsertBookingExtra): Promise<BookingExtra>;
  getBookingExtras(bookingId: string): Promise<BookingExtra[]>;
  getMonthlyBookings(boatId: string, year: number, month: number): Promise<Booking[]>;
  checkAvailability(boatId: string, startTime: Date, endTime: Date): Promise<boolean>;
  checkAvailabilityAndCreateBooking(boatId: string, startTime: Date, endTime: Date, bookingData: InsertBooking): Promise<{ available: true; booking: Booking } | { available: false; booking: null }>;
  cleanupExpiredHolds(): Promise<number>;
  getOverlappingBookingsWithBuffer(boatId: string, startTime: Date, endTime: Date): Promise<Booking[]>;

  // Analytics
  getDashboardStats(startDate: Date, endDate: Date): Promise<{ bookingsCount: number; revenue: number; confirmedBookings: number; pendingBookings: number }>;
  getDashboardStatsEnhanced(startDate: Date, endDate: Date): Promise<{ bookingsCount: number; revenue: number; confirmedBookings: number; pendingBookings: number; previousPeriodRevenue: number; previousPeriodBookings: number; averageTicket: number; previousAverageTicket: number }>;
  getFleetAvailability(): Promise<{ totalBoats: number; availableBoats: number }>;
  getRevenueTrend(period: "30d" | "90d" | "365d"): Promise<Array<{ date: string; revenue: number; bookings: number }>>;
  getBoatsPerformance(period: "month" | "season" | "year"): Promise<Array<{ boatId: string; boatName: string; revenue: number; bookings: number; hours: number; utilization: number }>>;
  getStatusDistribution(startDate: Date, endDate: Date): Promise<{ confirmed: number; pending_payment: number; hold: number; cancelled: number; completed: number; draft: number }>;

  // Testimonials
  getTestimonials(): Promise<Testimonial[]>;
  getTestimonialsByBoat(boatId: string): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;

  // Blog
  getAllBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPostsByCategory(category: string): Promise<BlogPost[]>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;

  // Destinations
  getAllDestinations(): Promise<Destination[]>;
  getPublishedDestinations(): Promise<Destination[]>;
  getDestination(id: string): Promise<Destination | undefined>;
  getDestinationBySlug(slug: string): Promise<Destination | undefined>;
  createDestination(destination: InsertDestination): Promise<Destination>;
  updateDestination(id: string, destination: Partial<InsertDestination>): Promise<Destination | undefined>;
  deleteDestination(id: string): Promise<boolean>;

  // Gallery
  getApprovedPhotos(): Promise<ClientPhoto[]>;
  getAllPhotos(): Promise<ClientPhoto[]>;
  createClientPhoto(photo: InsertClientPhoto): Promise<ClientPhoto>;
  updateClientPhoto(id: string, updates: Partial<ClientPhoto>): Promise<ClientPhoto | undefined>;
  deleteClientPhoto(id: string): Promise<boolean>;

  // Gift Cards
  getAllGiftCards(): Promise<GiftCard[]>;
  getGiftCardByCode(code: string): Promise<GiftCard | undefined>;
  getGiftCardById(id: string): Promise<GiftCard | undefined>;
  createGiftCard(giftCard: InsertGiftCard): Promise<GiftCard>;
  updateGiftCard(id: string, updates: Partial<GiftCard>): Promise<GiftCard | undefined>;

  // Discount Codes
  createDiscountCode(data: InsertDiscountCode): Promise<DiscountCode>;
  getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined>;
  useDiscountCode(code: string, bookingId: string): Promise<DiscountCode | undefined>;
  getDiscountCodes(): Promise<DiscountCode[]>;
  getDiscountCodesByEmail(email: string): Promise<DiscountCode[]>;
  generateRepeatCustomerCode(email: string, bookingId: string): Promise<DiscountCode>;

  // Email/scheduler
  getUpcomingBookingsForReminder(hoursAhead: number): Promise<Booking[]>;
  getCompletedBookingsForThankYou(hoursAfter: number): Promise<Booking[]>;
  autoCompleteBookings(): Promise<number>;
  isRepeatCustomer(email: string): Promise<boolean>;
  updateBookingEmailStatus(id: string, reminderSent?: boolean, thankYouSent?: boolean): Promise<Booking | undefined>;
  updateBookingWhatsAppThankYouStatus(id: string, sent: boolean): Promise<void>;

  // Social proof
  getRecentSocialProofBookings(): Promise<SocialProofBooking[]>;

  // Chatbot
  getChatbotConversation(phoneNumber: string): Promise<ChatbotConversation | undefined>;
  createChatbotConversation(conversation: InsertChatbotConversation): Promise<ChatbotConversation>;
  updateChatbotConversation(phoneNumber: string, updates: UpdateChatbotConversation): Promise<ChatbotConversation | undefined>;
  resetChatbotConversation(phoneNumber: string): Promise<ChatbotConversation | undefined>;
  getOrCreateChatbotConversation(phoneNumber: string, language?: string): Promise<ChatbotConversation>;

  // CRM Customers
  upsertCrmCustomer(booking: Booking): Promise<CrmCustomer>;
  getPaginatedCrmCustomers(params: { page: number; limit: number; search?: string; segment?: string; nationality?: string; sortBy?: string; sortOrder?: "asc" | "desc" }): Promise<{ data: CrmCustomer[]; total: number; page: number; totalPages: number; bestCustomerName: string | null; bestCustomerSpent: string | null; totalSpentAll: string; totalCustomersAll: number }>;
  getCrmCustomerById(id: string): Promise<{ customer: CrmCustomer; bookings: Booking[] } | undefined>;
  updateCrmCustomer(id: string, data: UpdateCrmCustomer): Promise<CrmCustomer | undefined>;
  recalculateCustomerStats(customerId: string): Promise<CrmCustomer | undefined>;
  syncAllCustomersFromBookings(): Promise<{ created: number; updated: number }>;

  // Checkins
  createCheckin(data: InsertCheckin): Promise<Checkin>;
  getCheckinsByBooking(bookingId: string): Promise<Checkin[]>;
  getLatestCheckin(bookingId: string, type: string): Promise<Checkin | undefined>;

  // Maintenance
  createMaintenanceLog(data: InsertMaintenanceLog): Promise<MaintenanceLog>;
  getMaintenanceLogs(boatId?: string): Promise<MaintenanceLog[]>;
  getMaintenanceLog(id: string): Promise<MaintenanceLog | undefined>;
  updateMaintenanceLog(id: string, data: UpdateMaintenanceLog): Promise<MaintenanceLog | undefined>;
  deleteMaintenanceLog(id: string): Promise<boolean>;
  getUpcomingMaintenance(): Promise<MaintenanceLog[]>;

  // Boat Documents
  createBoatDocument(data: InsertBoatDocument): Promise<BoatDocument>;
  getBoatDocuments(boatId?: string): Promise<BoatDocument[]>;
  getBoatDocument(id: string): Promise<BoatDocument | undefined>;
  updateBoatDocument(id: string, data: UpdateBoatDocument): Promise<BoatDocument | undefined>;
  deleteBoatDocument(id: string): Promise<boolean>;
  getExpiringDocuments(daysAhead: number): Promise<BoatDocument[]>;

  // Inventory
  createInventoryItem(data: InsertInventoryItem): Promise<InventoryItem>;
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  updateInventoryItem(id: string, data: UpdateInventoryItem): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
  createInventoryMovement(data: InsertInventoryMovement): Promise<InventoryMovement>;
  getInventoryMovements(itemId: string): Promise<InventoryMovement[]>;
  getLowStockItems(): Promise<InventoryItem[]>;
  decrementExtrasStock(bookingId: string): Promise<void>;

  // Newsletter
  createNewsletterSubscriber(email: string, language: string, source: string): Promise<NewsletterSubscriber>;

  // WhatsApp Inquiries
  getWhatsappInquiry(id: string): Promise<WhatsappInquiry | undefined>;
  createWhatsappInquiry(data: InsertWhatsappInquiry): Promise<WhatsappInquiry>;
  getPaginatedInquiries(params: { page: number; limit: number; status?: string; search?: string }): Promise<{ data: WhatsappInquiry[]; total: number; page: number; totalPages: number }>;
  updateWhatsappInquiry(id: string, data: UpdateWhatsappInquiry): Promise<WhatsappInquiry | undefined>;
  deleteWhatsappInquiry(id: string): Promise<boolean>;
}
