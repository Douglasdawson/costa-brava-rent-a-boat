/**
 * Storage Layer - Unified access point
 *
 * Domain repositories are split into separate files for maintainability.
 * This index re-exports a single `storage` object that implements IStorage
 * for full backwards compatibility.
 */

import * as tenantRepo from "./tenants";
import * as authRepo from "./auth";
import * as boatRepo from "./boats";
import * as bookingRepo from "./bookings";
import * as analyticsRepo from "./analytics";
import * as contentRepo from "./content";
import * as galleryRepo from "./gallery";
import * as promotionsRepo from "./promotions";
import * as customerRepo from "./customers";
import * as chatbotRepo from "./chatbot";
import * as inventoryRepo from "./inventory";
import * as inquiryRepo from "./inquiries";

// Re-export the IStorage interface for consumers that import it
export type { IStorage } from "./types";

/**
 * Unified storage object — backwards-compatible with all existing code.
 * Each method delegates to its domain repository.
 */
export const storage = {
  // ===== Tenants =====
  getTenant: tenantRepo.getTenant,
  getTenantBySlug: tenantRepo.getTenantBySlug,
  createTenant: tenantRepo.createTenant,
  updateTenant: tenantRepo.updateTenant,
  getAllTenants: tenantRepo.getAllTenants,
  seedDefaultTenant: tenantRepo.seedDefaultTenant,

  // ===== Auth (Users, Tokens, Sessions) =====
  getUserById: authRepo.getUserById,
  getUserByEmail: authRepo.getUserByEmail,
  getUsersByTenant: authRepo.getUsersByTenant,
  createUser: authRepo.createUser,
  updateUser: authRepo.updateUser,
  createRefreshToken: authRepo.createRefreshToken,
  getRefreshToken: authRepo.getRefreshToken,
  deleteRefreshToken: authRepo.deleteRefreshToken,
  deleteUserRefreshTokens: authRepo.deleteUserRefreshTokens,
  cleanupExpiredRefreshTokens: authRepo.cleanupExpiredRefreshTokens,
  createPasswordResetToken: authRepo.createPasswordResetToken,
  getPasswordResetToken: authRepo.getPasswordResetToken,
  markPasswordResetTokenUsed: authRepo.markPasswordResetTokenUsed,
  migrateAdminUsersToUsers: authRepo.migrateAdminUsersToUsers,
  getAdminUser: authRepo.getAdminUser,
  getAdminUserByUsername: authRepo.getAdminUserByUsername,
  createAdminUser: authRepo.createAdminUser,
  updateAdminUser: authRepo.updateAdminUser,
  getAllAdminUsers: authRepo.getAllAdminUsers,
  getCustomerUser: authRepo.getCustomerUser,
  upsertCustomerUser: authRepo.upsertCustomerUser,
  getCustomer: authRepo.getCustomer,
  getCustomerByUserId: authRepo.getCustomerByUserId,
  createCustomer: authRepo.createCustomer,
  updateCustomer: authRepo.updateCustomer,
  createAdminSession: authRepo.createAdminSession,
  deleteAdminSession: authRepo.deleteAdminSession,
  isTokenBlacklisted: authRepo.isTokenBlacklisted,
  blacklistToken: authRepo.blacklistToken,
  cleanupExpiredSessions: authRepo.cleanupExpiredSessions,

  // ===== Boats =====
  getAllBoats: boatRepo.getAllBoats,
  getBoat: boatRepo.getBoat,
  createBoat: boatRepo.createBoat,
  updateBoat: boatRepo.updateBoat,

  // ===== Bookings =====
  createBooking: bookingRepo.createBooking,
  getBooking: bookingRepo.getBooking,
  getBookingById: bookingRepo.getBookingById,
  getBookingsByDate: bookingRepo.getBookingsByDate,
  getBookingsByBoatAndDateRange: bookingRepo.getBookingsByBoatAndDateRange,
  getOverlappingBookingsWithBuffer: bookingRepo.getOverlappingBookingsWithBuffer,
  updateBooking: bookingRepo.updateBooking,
  updateBookingPaymentStatus: bookingRepo.updateBookingPaymentStatus,
  updateBookingWhatsAppStatus: bookingRepo.updateBookingWhatsAppStatus,
  getAllBookings: bookingRepo.getAllBookings,
  getBookingByCancelationToken: bookingRepo.getBookingByCancelationToken,
  cancelBookingByToken: bookingRepo.cancelBookingByToken,
  getPaginatedBookings: bookingRepo.getPaginatedBookings,
  getBookingsForCalendar: bookingRepo.getBookingsForCalendar,
  createBookingExtra: bookingRepo.createBookingExtra,
  getBookingExtras: bookingRepo.getBookingExtras,
  getMonthlyBookings: bookingRepo.getMonthlyBookings,
  checkAvailability: bookingRepo.checkAvailability,
  cleanupExpiredHolds: bookingRepo.cleanupExpiredHolds,
  getUpcomingBookingsForReminder: bookingRepo.getUpcomingBookingsForReminder,
  getCompletedBookingsForThankYou: bookingRepo.getCompletedBookingsForThankYou,
  autoCompleteBookings: bookingRepo.autoCompleteBookings,
  isRepeatCustomer: bookingRepo.isRepeatCustomer,
  updateBookingEmailStatus: bookingRepo.updateBookingEmailStatus,
  updateBookingWhatsAppThankYouStatus: bookingRepo.updateBookingWhatsAppThankYouStatus,

  // ===== Analytics =====
  getDashboardStats: analyticsRepo.getDashboardStats,
  getFleetAvailability: analyticsRepo.getFleetAvailability,
  getDashboardStatsEnhanced: analyticsRepo.getDashboardStatsEnhanced,
  getRevenueTrend: analyticsRepo.getRevenueTrend,
  getBoatsPerformance: analyticsRepo.getBoatsPerformance,
  getStatusDistribution: analyticsRepo.getStatusDistribution,

  // ===== Content (Blog, Destinations, Testimonials, Newsletter) =====
  getTestimonials: contentRepo.getTestimonials,
  getTestimonialsByBoat: contentRepo.getTestimonialsByBoat,
  createTestimonial: contentRepo.createTestimonial,
  getAllBlogPosts: contentRepo.getAllBlogPosts,
  getPublishedBlogPosts: contentRepo.getPublishedBlogPosts,
  getBlogPost: contentRepo.getBlogPost,
  getBlogPostBySlug: contentRepo.getBlogPostBySlug,
  getBlogPostsByCategory: contentRepo.getBlogPostsByCategory,
  createBlogPost: contentRepo.createBlogPost,
  updateBlogPost: contentRepo.updateBlogPost,
  deleteBlogPost: contentRepo.deleteBlogPost,
  getAllDestinations: contentRepo.getAllDestinations,
  getPublishedDestinations: contentRepo.getPublishedDestinations,
  getDestination: contentRepo.getDestination,
  getDestinationBySlug: contentRepo.getDestinationBySlug,
  createDestination: contentRepo.createDestination,
  updateDestination: contentRepo.updateDestination,
  deleteDestination: contentRepo.deleteDestination,
  createNewsletterSubscriber: contentRepo.createNewsletterSubscriber,

  // ===== Gallery =====
  getApprovedPhotos: galleryRepo.getApprovedPhotos,
  getAllPhotos: galleryRepo.getAllPhotos,
  createClientPhoto: galleryRepo.createClientPhoto,
  updateClientPhoto: galleryRepo.updateClientPhoto,
  deleteClientPhoto: galleryRepo.deleteClientPhoto,

  // ===== Promotions (Gift Cards, Discounts) =====
  getAllGiftCards: promotionsRepo.getAllGiftCards,
  getGiftCardByCode: promotionsRepo.getGiftCardByCode,
  getGiftCardById: promotionsRepo.getGiftCardById,
  createGiftCard: promotionsRepo.createGiftCard,
  updateGiftCard: promotionsRepo.updateGiftCard,
  createDiscountCode: promotionsRepo.createDiscountCode,
  getDiscountCodeByCode: promotionsRepo.getDiscountCodeByCode,
  useDiscountCode: promotionsRepo.useDiscountCode,
  getDiscountCodes: promotionsRepo.getDiscountCodes,
  getDiscountCodesByEmail: promotionsRepo.getDiscountCodesByEmail,
  generateRepeatCustomerCode: promotionsRepo.generateRepeatCustomerCode,

  // ===== CRM Customers =====
  upsertCrmCustomer: customerRepo.upsertCrmCustomer,
  getPaginatedCrmCustomers: customerRepo.getPaginatedCrmCustomers,
  getCrmCustomerById: customerRepo.getCrmCustomerById,
  updateCrmCustomer: customerRepo.updateCrmCustomer,
  recalculateCustomerStats: customerRepo.recalculateCustomerStats,
  syncAllCustomersFromBookings: customerRepo.syncAllCustomersFromBookings,

  // ===== Chatbot =====
  getChatbotConversation: chatbotRepo.getChatbotConversation,
  createChatbotConversation: chatbotRepo.createChatbotConversation,
  updateChatbotConversation: chatbotRepo.updateChatbotConversation,
  resetChatbotConversation: chatbotRepo.resetChatbotConversation,
  getOrCreateChatbotConversation: chatbotRepo.getOrCreateChatbotConversation,

  // ===== Inventory (Checkins, Maintenance, Documents, Stock) =====
  createCheckin: inventoryRepo.createCheckin,
  getCheckinsByBooking: inventoryRepo.getCheckinsByBooking,
  getLatestCheckin: inventoryRepo.getLatestCheckin,
  createMaintenanceLog: inventoryRepo.createMaintenanceLog,
  getMaintenanceLogs: inventoryRepo.getMaintenanceLogs,
  getMaintenanceLog: inventoryRepo.getMaintenanceLog,
  updateMaintenanceLog: inventoryRepo.updateMaintenanceLog,
  deleteMaintenanceLog: inventoryRepo.deleteMaintenanceLog,
  getUpcomingMaintenance: inventoryRepo.getUpcomingMaintenance,
  createBoatDocument: inventoryRepo.createBoatDocument,
  getBoatDocuments: inventoryRepo.getBoatDocuments,
  getBoatDocument: inventoryRepo.getBoatDocument,
  updateBoatDocument: inventoryRepo.updateBoatDocument,
  deleteBoatDocument: inventoryRepo.deleteBoatDocument,
  getExpiringDocuments: inventoryRepo.getExpiringDocuments,
  createInventoryItem: inventoryRepo.createInventoryItem,
  getInventoryItems: inventoryRepo.getInventoryItems,
  getInventoryItem: inventoryRepo.getInventoryItem,
  updateInventoryItem: inventoryRepo.updateInventoryItem,
  deleteInventoryItem: inventoryRepo.deleteInventoryItem,
  createInventoryMovement: inventoryRepo.createInventoryMovement,
  getInventoryMovements: inventoryRepo.getInventoryMovements,
  getLowStockItems: inventoryRepo.getLowStockItems,
  decrementExtrasStock: inventoryRepo.decrementExtrasStock,

  // ===== WhatsApp Inquiries =====
  getWhatsappInquiry: inquiryRepo.getWhatsappInquiry,
  createWhatsappInquiry: inquiryRepo.createWhatsappInquiry,
  getPaginatedInquiries: inquiryRepo.getPaginatedInquiries,
  updateWhatsappInquiry: inquiryRepo.updateWhatsappInquiry,
  deleteWhatsappInquiry: inquiryRepo.deleteWhatsappInquiry,
};
