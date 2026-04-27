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
import * as companyRepo from "./company";
import * as auditRepo from "./audit";
import * as membershipRepo from "./memberships";
import * as experimentsRepo from "./experiments";
import * as featureFlagsRepo from "./featureFlags";
import * as leadNurturingRepo from "./leadNurturing";
import * as mcpTokensRepo from "./mcpTokens";
import * as seoAutopilotRepo from "./seoAutopilot";
import * as businessStatsRepo from "./businessStats";
import * as pricingOverridesRepo from "./pricingOverrides";

// Re-export the IStorage interface for consumers that import it
export type { IStorage } from "./types";

// Re-export full modules for consumers that need more than what's exposed
// on the unified `storage` object (routes, MCP server).
export { mcpTokensRepo, seoAutopilotRepo };

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
  getAdminUsersWithPin: authRepo.getAdminUsersWithPin,
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
  getBookingById: bookingRepo.getBooking,
  getBookingsByDate: bookingRepo.getBookingsByDate,
  getBookingsByBoatAndDateRange: bookingRepo.getBookingsByBoatAndDateRange,
  getOverlappingBookingsWithBuffer: bookingRepo.getOverlappingBookingsWithBuffer,
  updateBooking: bookingRepo.updateBooking,
  updateBookingPaymentStatus: bookingRepo.updateBookingPaymentStatus,
  updateBookingWhatsAppStatus: bookingRepo.updateBookingWhatsAppStatus,
  getAllBookings: bookingRepo.getAllBookings,
  getConfirmedBookings: bookingRepo.getConfirmedBookings,
  getConfirmedBookingsWithEmail: bookingRepo.getConfirmedBookingsWithEmail,
  getBookingsByCustomer: bookingRepo.getBookingsByCustomer,
  getBookingByCancelationToken: bookingRepo.getBookingByCancelationToken,
  cancelBookingByToken: bookingRepo.cancelBookingByToken,
  getPaginatedBookings: bookingRepo.getPaginatedBookings,
  getBookingsForCalendar: bookingRepo.getBookingsForCalendar,
  createBookingExtra: bookingRepo.createBookingExtra,
  getBookingExtras: bookingRepo.getBookingExtras,
  getDailyBookings: bookingRepo.getDailyBookings,
  getMonthlyBookings: bookingRepo.getMonthlyBookings,
  checkAvailability: bookingRepo.checkAvailability,
  checkAvailabilityAndCreateBooking: bookingRepo.checkAvailabilityAndCreateBooking,
  cleanupExpiredHolds: bookingRepo.cleanupExpiredHolds,
  getUpcomingBookingsForReminder: bookingRepo.getUpcomingBookingsForReminder,
  getCompletedBookingsForThankYou: bookingRepo.getCompletedBookingsForThankYou,
  autoCompleteBookings: bookingRepo.autoCompleteBookings,
  isRepeatCustomer: bookingRepo.isRepeatCustomer,
  updateBookingEmailStatus: bookingRepo.updateBookingEmailStatus,
  updateBookingWhatsAppThankYouStatus: bookingRepo.updateBookingWhatsAppThankYouStatus,
  getRecentSocialProofBookings: bookingRepo.getRecentSocialProofBookings,
  // Post-rental flywheel
  getBookingsForReviewRequest: bookingRepo.getBookingsForReviewRequest,
  getBookingsForReferralCode: bookingRepo.getBookingsForReferralCode,
  getBookingsForEarlyBird: bookingRepo.getBookingsForEarlyBird,
  markFlywheelStepSent: bookingRepo.markFlywheelStepSent,

  // ===== Analytics =====
  getDashboardStats: analyticsRepo.getDashboardStats,
  getFleetAvailability: analyticsRepo.getFleetAvailability,
  getDashboardStatsEnhanced: analyticsRepo.getDashboardStatsEnhanced,
  getRevenueTrend: analyticsRepo.getRevenueTrend,
  getBoatsPerformance: analyticsRepo.getBoatsPerformance,
  getStatusDistribution: analyticsRepo.getStatusDistribution,
  getYieldAnalytics: analyticsRepo.getYieldAnalytics,

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
  getActiveNewsletterSubscribers: contentRepo.getActiveNewsletterSubscribers,
  getActiveSubscribersByLanguage: contentRepo.getActiveSubscribersByLanguage,
  unsubscribeNewsletter: contentRepo.unsubscribeNewsletter,
  getRecentPublishedBlogPosts: contentRepo.getRecentPublishedBlogPosts,

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

  // ===== Pricing Overrides (dynamic pricing) =====
  listPricingOverrides: pricingOverridesRepo.listPricingOverrides,
  getPricingOverride: pricingOverridesRepo.getPricingOverride,
  createPricingOverride: pricingOverridesRepo.createPricingOverride,
  updatePricingOverride: pricingOverridesRepo.updatePricingOverride,
  deactivatePricingOverride: pricingOverridesRepo.deactivatePricingOverride,
  loadActiveOverridesForDate: pricingOverridesRepo.loadActiveOverridesForDate,
  loadActiveOverridesForRange: pricingOverridesRepo.loadActiveOverridesForRange,

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

  // ===== Company Config =====
  getCompanyConfig: companyRepo.getCompanyConfig,
  updateCompanyConfig: companyRepo.updateCompanyConfig,

  // ===== Audit Log =====
  createAuditLog: auditRepo.createAuditLog,
  getRecentAuditLogs: auditRepo.getRecentAuditLogs,

  // ===== Memberships (Boat Club) =====
  createMembership: membershipRepo.createMembership,
  getMembershipById: membershipRepo.getMembershipById,
  getMembershipByEmail: membershipRepo.getMembershipByEmail,
  getActiveMemberships: membershipRepo.getActiveMemberships,
  getAllMemberships: membershipRepo.getAllMemberships,
  updateMembership: membershipRepo.updateMembership,
  deductFreeHours: membershipRepo.deductFreeHours,
  getMembershipStats: membershipRepo.getMembershipStats,
  expireOverdueMemberships: membershipRepo.expireOverdueMemberships,

  // ===== Experiments (A/B Testing) =====
  getActiveExperiments: experimentsRepo.getActiveExperiments,
  getAllExperiments: experimentsRepo.getAllExperiments,
  getExperimentById: experimentsRepo.getExperimentById,
  getExperimentByName: experimentsRepo.getExperimentByName,
  createExperiment: experimentsRepo.createExperiment,
  updateExperiment: experimentsRepo.updateExperiment,
  getOrCreateAssignment: experimentsRepo.getOrCreateAssignment,
  trackExperimentEvent: experimentsRepo.trackEvent,
  getExperimentResults: experimentsRepo.getExperimentResults,

  // ===== Feature Flags =====
  getFeatureFlagsForTenant: featureFlagsRepo.getFeatureFlagsForTenant,
  isFeatureEnabled: featureFlagsRepo.isFeatureEnabled,
  setFeatureFlag: featureFlagsRepo.setFeatureFlag,
  getTenantFlags: featureFlagsRepo.getTenantFlags,
  deleteTenantFlag: featureFlagsRepo.deleteTenantFlag,
  getGlobalFlags: featureFlagsRepo.getGlobalFlags,
  createGlobalFlag: featureFlagsRepo.createGlobalFlag,
  updateGlobalFlag: featureFlagsRepo.updateGlobalFlag,
  deleteGlobalFlag: featureFlagsRepo.deleteGlobalFlag,

  // ===== Lead Nurturing =====
  getLeadsForNurturing: leadNurturingRepo.getLeadsForNurturing,
  markLeadNurtured: leadNurturingRepo.markLeadNurtured,
  wasNurturedRecently: leadNurturingRepo.wasNurturedRecently,
  isAlreadySubscribed: leadNurturingRepo.isAlreadySubscribed,
  getNurturingStats: leadNurturingRepo.getNurturingStats,

  // ===== MCP Tokens (seo-autopilot) =====
  createMcpToken: mcpTokensRepo.createMcpToken,
  listMcpTokens: mcpTokensRepo.listMcpTokens,
  getMcpTokenById: mcpTokensRepo.getMcpTokenById,
  validateMcpToken: mcpTokensRepo.validateMcpToken,
  recordTokenUsage: mcpTokensRepo.recordTokenUsage,
  revokeMcpToken: mcpTokensRepo.revokeMcpToken,

  // ===== SEO Autopilot =====
  createDistributionItem: seoAutopilotRepo.createDistributionItem,
  createDistributionItemsBatch: seoAutopilotRepo.createDistributionItemsBatch,
  getDistributionTray: seoAutopilotRepo.getDistributionTray,
  getDistributionItemById: seoAutopilotRepo.getDistributionItemById,
  updateDistributionStatus: seoAutopilotRepo.updateDistributionStatus,
  markDistributionPublished: seoAutopilotRepo.markDistributionPublished,
  markDistributionFailed: seoAutopilotRepo.markDistributionFailed,
  deleteDistributionItem: seoAutopilotRepo.deleteDistributionItem,
  getDistributionTrayStats: seoAutopilotRepo.getDistributionTrayStats,
  recordAutopilotAudit: seoAutopilotRepo.recordAudit,
  getAutopilotAuditLog: seoAutopilotRepo.getAuditLog,
  getAutopilotOverview: seoAutopilotRepo.getOverviewData,
  getAutopilotAlerts: seoAutopilotRepo.getAlerts,

  // ===== Business Stats (Google Business Profile sync) =====
  getBusinessStats: businessStatsRepo.getBusinessStats,
  upsertBusinessStats: businessStatsRepo.upsertBusinessStats,
};
