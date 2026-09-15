import 'dotenv/config';
import express, { Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import process from 'node:process';
import { createServer as createViteServer } from 'vite';
import { requireAuth, requireRole, AuthRequest, totalAuthFailures } from './src/middleware/auth.ts';
import {
  generalRateLimiter,
  authRateLimiter,
  orderCreationRateLimiter,
  aiRateLimiter,
  orderTrackingRateLimiter,
  totalRateLimitEvents,
} from './src/middleware/rateLimit.ts';
import { seedDatabase } from './src/db/seed.ts';
import {
  getCanteenStatus,
  updateCanteenStatus,
  getAllCategories,
  ensureDatabaseSchema,
  getFoodItemsList,
  createFoodItemRecord,
  updateFoodItemRecord,
  deleteFoodItemRecord,
  createStudentOrder,
  getOrderDetailsById,
  getOrderDetailsByToken,
  getUserOrdersHistory,
  getStaffOrdersList,
  updateOrderStatusByStaff,
  updateOrderPaymentStatusByStaff,
  submitOrderFeedback,
  getFeedbackSummary,
  getInventoryStatus,
  updateInventoryStock,
  getUserNotifications,
  markNotificationRead,
  getAnalyticsDashboardData,
  getSmartCanteenIntelligence,
} from './src/db/queries.ts';
import { sql } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import { users, notifications } from './src/db/schema.ts';
import { updateUserRole, demoteUserToStudent, promoteUserToAdmin } from './src/db/users.ts';
import {
  getOfficialCanteenProfile,
  registerOfficialCanteen,
  isOfficialCanteenAccount,
  transferOfficialCanteenEmail,
  updateOfficialCanteenLocation,
  updateCampusCoverage,
} from './src/db/canteenProfile.ts';
import {
  requestOldEmailSecretCode,
  verifyOldEmailSecretCode,
  requestNewEmailSecretCode,
  finalizeEmailTransferWithCodes,
  getRecentSecurityDispatches,
} from './src/services/verificationCodeService.ts';
import { addFallbackNotification } from './src/db/fallbackData.ts';
import { aiService } from './src/services/ai/aiService.ts';

let totalBackendErrors = 0;

function handleApiError(res: Response, error: any, defaultUserMsg: string = 'An unexpected error occurred. Please try again.') {
  totalBackendErrors++;
  const rawMessage: string = error?.message || '';
  console.error('[API Error]:', error);

  // Check for known domain errors
  if (
    rawMessage.includes('Cannot place an empty order') ||
    rawMessage.includes('Quantity must be') ||
    rawMessage.includes('not found') ||
    rawMessage.includes('does not exist') ||
    rawMessage.includes('marked unavailable') ||
    rawMessage.includes('Insufficient stock') ||
    rawMessage.includes('Invalid order status') ||
    rawMessage.includes('Rating must be')
  ) {
    return res.status(400).json({
      error: 'Bad Request',
      message: rawMessage,
    });
  }

  if (rawMessage.includes('Inventory race condition')) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Item was just reserved by another customer. Please review your tray and try again.',
    });
  }

  // Sanitized 500 response (never leak internal stack trace, SQL query, or DB secrets)
  return res.status(500).json({
    error: 'Internal Server Error',
    message: defaultUserMsg,
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Apply Helmet HTTP security headers (HSTS, nosniff, frameguard, remove X-Powered-By)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Prevents breaking Firebase Auth popups, Google OAuth avatars, and external CDN scripts
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );

  // Trust Cloud Run / reverse proxy headers for accurate client IP rate limiting
  app.set('trust proxy', 1);

  // Cross-Origin Resource Sharing (Supports web, local dev ports, and Android clients)
  const allowedOrigins = [
    ...(process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000']),
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : []),
    ...(process.env.APP_URL ? [process.env.APP_URL.trim()] : []),
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow mobile apps, curl, or server-to-server requests (where origin is not sent)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.startsWith('http://10.0.2.2:') ||
          origin.startsWith('exp://') ||
          (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://') || origin.startsWith('https://')))
        ) {
          return callback(null, true);
        }
        return callback(new Error(`CORS policy violation: origin ${origin} is not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
    })
  );

  app.use(express.json());

  // General rate limiting across all API routes
  app.use('/api/', generalRateLimiter);

  // Ensure database schema migrations and seed database if empty
  ensureDatabaseSchema()
    .then(() => seedDatabase())
    .catch((err) => {
      console.error('Error during auto-seed/schema ensure:', err);
    });

  // Health check (lightweight)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'smart-canteen-api',
      timestamp: new Date().toISOString(),
    });
  });

  // System Health Telemetry (Admin Only)
  app.get('/api/admin/health', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
    let dbStatus: 'HEALTHY' | 'DOWN' = 'HEALTHY';
    try {
      await db.execute(sql`SELECT 1`);
    } catch (dbErr) {
      console.error('Database health check failed:', dbErr);
      dbStatus = 'DOWN';
    }

    const aiTelemetry = aiService.getTelemetry();
    let aiStatus: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE' = 'AVAILABLE';
    if (aiTelemetry.circuitState === 'OPEN') {
      aiStatus = 'UNAVAILABLE';
    } else if (aiTelemetry.circuitState === 'HALF-OPEN' || aiTelemetry.fallbackCount > 0) {
      aiStatus = 'DEGRADED';
    }

    const overallStatus = dbStatus === 'HEALTHY' ? 'HEALTHY' : 'DEGRADED';

    res.json({
      status: overallStatus,
      components: {
        coreApplication: 'HEALTHY',
        database: dbStatus,
        aiProvider: aiStatus,
      },
      aiTelemetry,
      metrics: {
        totalRateLimitEvents,
        totalAuthFailures,
        totalBackendErrors,
        uptimeSeconds: Math.round(process.uptime()),
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Auth User Profile (Reads verified database role, strictly locked)
  app.get('/api/auth/me', requireAuth, authRateLimiter, (req: AuthRequest, res) => {
    if (req.currentUser && !isOfficialCanteenAccount(req.currentUser.email)) {
      req.currentUser.role = 'student';
    }
    res.json({ user: req.currentUser });
  });

  // Switch Portal Role (Updates role for session and database)
  app.post('/api/auth/role', requireAuth, async (req: AuthRequest, res) => {
    const { role } = req.body;
    if (!['student', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Supported: student, staff, admin' });
    }

    // Role-Lock: Only the registered official canteen account can switch to Staff or Admin!
    if ((role === 'staff' || role === 'admin') && !isOfficialCanteenAccount(req.currentUser?.email)) {
      return res.status(403).json({
        error: 'Forbidden',
        message:
          'Access Denied: Only the verified official canteen account can access the Staff or Administrator portal. Other members are restricted to the Student portal.',
      });
    }

    if (req.currentUser) {
      req.currentUser.role = role;
      await updateUserRole(req.currentUser.uid, role, req.currentUser.email);
    }
    res.json({ success: true, role, user: req.currentUser });
  });

  // Official Canteen Profile & Verification
  app.get('/api/canteen/official-profile', async (req, res) => {
    try {
      const profile = getOfficialCanteenProfile();
      res.json(profile);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to load official canteen profile.');
    }
  });

  app.post('/api/canteen/register-official', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { operatorName, officialEmail, photoUrl, phone, canteenName, passcode } = req.body;
      const targetEmail = officialEmail || req.currentUser?.email || '';
      const result = registerOfficialCanteen({
        operatorName: operatorName || req.currentUser?.name || 'Official Canteen Manager',
        officialEmail: targetEmail,
        photoUrl: photoUrl || req.currentUser?.avatarUrl,
        phone,
        canteenName,
        passcode,
      });
      if (!result.success) {
        return res.status(400).json({ error: 'Verification Failed', message: result.error });
      }
      if (req.currentUser && isOfficialCanteenAccount(req.currentUser.email)) {
        req.currentUser.role = 'admin';
        await updateUserRole(req.currentUser.uid, 'admin');
      }
      res.json(result);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to register official canteen account.');
    }
  });

  // Transfer Official Canteen Email / Ownership
  app.post('/api/canteen/transfer-official-email', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { newEmail, passcode } = req.body;
      const currentOfficial = getOfficialCanteenProfile();
      const oldEmail = currentOfficial.officialEmail;

      const transferResult = transferOfficialCanteenEmail({
        oldEmail,
        newEmail,
        passcode,
      });

      if (!transferResult.success) {
        return res.status(400).json({ error: 'Transfer Failed', message: transferResult.error });
      }

      // Demote old account in DB & in-memory cache
      await demoteUserToStudent(oldEmail);

      // Promote new account if already exists
      await promoteUserToAdmin(newEmail);

      // If the caller is the old email, demote their current request context immediately
      if (req.currentUser && req.currentUser.email.trim().toLowerCase() === oldEmail.trim().toLowerCase()) {
        req.currentUser.role = 'student';
      }

      // Record audit notification
      addFallbackNotification({
        userId: req.currentUser?.id || 1,
        title: 'Official Canteen Account Transferred',
        message: `Canteen management authority was successfully transferred from "${oldEmail}" to "${newEmail}". The old account has been demoted to Student with all administrative access revoked.`,
        type: 'order_status',
      });

      res.json({
        success: true,
        message: `Official canteen ownership successfully transferred to ${newEmail}. The previous account (${oldEmail}) has been demoted to Student.`,
        oldOfficialEmail: oldEmail,
        newOfficialEmail: newEmail,
        profile: transferResult.profile,
      });
    } catch (error: any) {
      handleApiError(res, error, 'Failed to transfer official canteen email.');
    }
  });

  // Calibrate or update Official Canteen Campus GPS Location
  app.put('/api/canteen/location', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { latitude, longitude, campusName, radiusMeters, address } = req.body;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: 'Validation Error', message: 'Valid numerical latitude and longitude are required.' });
      }
      const updatedProfile = updateOfficialCanteenLocation({
        latitude,
        longitude,
        campusName,
        radiusMeters: radiusMeters ? Number(radiusMeters) : undefined,
        address,
      });
      res.json({ success: true, profile: updatedProfile });
    } catch (error: any) {
      handleApiError(res, error, 'Unable to update canteen GPS location.');
    }
  });

  // Update Campus Area Coverage Radius & Zones
  app.put('/api/canteen/coverage', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { radiusMeters, campusZones } = req.body;
      const updated = updateCampusCoverage(Number(radiusMeters) || 5000, campusZones);
      res.json({ success: true, profile: updated });
    } catch (error: any) {
      handleApiError(res, error, 'Unable to update campus area coverage.');
    }
  });

  // 2-Step Transfer Step 1: Request Secret Code for Old Email
  app.post('/api/canteen/transfer/request-old-code', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { email, passcode } = req.body;
      const result = requestOldEmailSecretCode({ email, passcode });
      if (!result.success) {
        return res.status(400).json({ error: 'Verification Request Failed', message: result.error });
      }
      res.json(result);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to generate old email secret code.');
    }
  });

  // 2-Step Transfer Step 1 Verify: Verify Old Email Secret Code
  app.post('/api/canteen/transfer/verify-old-code', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { email, code } = req.body;
      const result = verifyOldEmailSecretCode({ email, code });
      if (!result.success) {
        return res.status(400).json({ error: 'Code Verification Failed', message: result.error });
      }
      res.json(result);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to verify old email secret code.');
    }
  });

  // 2-Step Transfer Step 2: Request Activation Code for New Gmail
  app.post('/api/canteen/transfer/request-new-code', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { newEmail, transferSessionToken } = req.body;
      const result = requestNewEmailSecretCode({ newEmail, transferSessionToken });
      if (!result.success) {
        return res.status(400).json({ error: 'Activation Request Failed', message: result.error });
      }
      res.json(result);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to generate new Gmail activation code.');
    }
  });

  // 2-Step Transfer Step 3: Verify New Code and Finalize Authority Transfer
  app.post('/api/canteen/transfer/complete', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { newEmail, code, transferSessionToken } = req.body;
      const result = await finalizeEmailTransferWithCodes({
        newEmail,
        code,
        transferSessionToken,
      });

      if (!result.success) {
        return res.status(400).json({ error: 'Transfer Finalization Failed', message: result.error });
      }

      // Demote current session if caller was the old email
      if (req.currentUser) {
        req.currentUser.role = 'student';
      }

      res.json({
        success: true,
        message: result.message,
        newOfficialEmail: result.newEmail,
        oldOfficialEmail: result.oldEmail,
      });
    } catch (error: any) {
      handleApiError(res, error, 'Failed to finalize authority transfer.');
    }
  });

  // View Recent Security Dispatches (For dev, testing, and security audit)
  app.get('/api/canteen/transfer/dispatches', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const dispatches = getRecentSecurityDispatches();
      res.json(dispatches);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to load security dispatches.');
    }
  });

  // Canteen Status
  app.get('/api/canteen/status', async (req, res) => {
    try {
      const status = await getCanteenStatus();
      res.json(status);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to load canteen live status.');
    }
  });

  app.put('/api/canteen/status', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const updated = await updateCanteenStatus(req.body);
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to update canteen status.');
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const cats = await getAllCategories();
      res.json(cats);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to load categories.');
    }
  });

  // Food Items
  app.get('/api/food-items', async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
      const isVeg = req.query.isVeg !== undefined ? req.query.isVeg === 'true' : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;
      const sortBy = req.query.sortBy as any;
      const includeInactive = req.query.includeInactive === 'true';

      const items = await getFoodItemsList({ categoryId, isVeg, search, sortBy, includeInactive });
      res.json(items);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to load menu items.');
    }
  });

  // Create food item — Unified Canteen Operator (Admin & Staff)
  app.post('/api/food-items', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const newItem = await createFoodItemRecord(req.body);
      res.status(201).json(newItem);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to create menu item.');
    }
  });

  // Full edit (name, price, category, description, image) — Unified Canteen Operator (Admin & Staff)
  app.put('/api/food-items/:id', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const updated = await updateFoodItemRecord(Number(req.params.id), req.body);
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to update menu item.');
    }
  });

  // Deactivate / hide item from catalog — Unified Canteen Operator (Admin & Staff)
  app.patch('/api/food-items/:id/toggle-active', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { isActive } = req.body;
      const updated = await updateFoodItemRecord(Number(req.params.id), { isActive: Boolean(isActive) });
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to toggle active status.');
    }
  });

  app.patch('/api/food-items/:id/toggle-availability', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { isAvailable } = req.body;
      const updated = await updateFoodItemRecord(Number(req.params.id), { isAvailable: Boolean(isAvailable) });
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to toggle item availability.');
    }
  });

  app.patch('/api/food-items/:id/stock', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { availableStock } = req.body;
      const updated = await updateFoodItemRecord(Number(req.params.id), { availableStock: Number(availableStock) });
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to update item stock.');
    }
  });

  // Delete item — Unified Canteen Operator (Admin & Staff)
  app.delete('/api/food-items/:id', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const deleted = await deleteFoodItemRecord(Number(req.params.id));
      res.json(deleted);
    } catch (error: any) {
      handleApiError(res, error, 'Failed to delete menu item.');
    }
  });

  // Orders - Protected with orderCreationRateLimiter and Idempotency handling
  app.post('/api/orders', orderCreationRateLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      const { items, specialInstructions, idempotencyKey } = req.body;
      const keyHeader = (req.headers['idempotency-key'] as string) || idempotencyKey;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Bad Request', message: 'Please provide items to order.' });
      }

      const order = await createStudentOrder(
        req.currentUser!.id,
        items,
        specialInstructions,
        keyHeader
      );
      res.status(201).json(order);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to place order at this time. Please try again.');
    }
  });

  app.get('/api/orders/my-orders', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getUserOrdersHistory(req.currentUser!.id);
      res.json(list);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to retrieve your order history.');
    }
  });

  app.get('/api/orders/track/:tokenNumber', orderTrackingRateLimiter, async (req, res) => {
    try {
      const order = await getOrderDetailsByToken(req.params.tokenNumber.toUpperCase());
      if (!order) {
        return res.status(404).json({ error: 'Not Found', message: 'Digital token not found or order has expired.' });
      }
      // Mask sensitive customer PII on public tracking display
      const sanitizedOrder = {
        ...order,
        customerEmail: order.customerEmail
          ? order.customerEmail.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}***${c}`)
          : undefined,
        customerPhone: order.customerPhone
          ? order.customerPhone.replace(/(\d{2,4})\d+(\d{2})/, '$1****$2')
          : undefined,
      };
      res.json(sanitizedOrder);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to track order token.');
    }
  });

  // Staff Orders Management (Protected by requireRole)
  app.get('/api/staff/orders', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const statusFilter = req.query.status as string;
      const ordersList = await getStaffOrdersList(statusFilter);
      res.json(ordersList);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to retrieve staff order queue.');
    }
  });

  app.patch('/api/staff/orders/:id/status', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      if (!['confirmed', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid order status specified.' });
      }
      const updated = await updateOrderStatusByStaff(Number(req.params.id), status);
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to update order status.');
    }
  });

  // Staff Payment Verification & Update
  app.patch('/api/staff/orders/:id/payment', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { paymentStatus } = req.body;
      if (!['paid', 'pay_at_canteen', 'pending'].includes(paymentStatus)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid payment status specified.' });
      }
      const updated = await updateOrderPaymentStatusByStaff(Number(req.params.id), paymentStatus);
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to update order payment status.');
    }
  });

  // Feedback (with order ownership authorization to prevent IDOR)
  app.post('/api/orders/:id/feedback', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { rating, comment, foodItemId } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Bad Request', message: 'Rating must be between 1 and 5 stars.' });
      }
      const orderId = Number(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid order ID.' });
      }

      const order = await getOrderDetailsById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Not Found', message: 'Order not found.' });
      }

      // Ensure authenticated user owns the order or has admin privilege
      if (order.userId !== req.currentUser!.id && req.currentUser!.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden', message: 'You can only submit feedback for your own orders.' });
      }

      const fb = await submitOrderFeedback({
        orderId,
        userId: req.currentUser!.id,
        rating: Number(rating),
        comment,
        foodItemId: foodItemId ? Number(foodItemId) : undefined,
      });
      res.status(201).json(fb);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to submit feedback.');
    }
  });

  app.get('/api/feedback/summary', async (req, res) => {
    try {
      const summary = await getFeedbackSummary();
      res.json(summary);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to load feedback summary.');
    }
  });

  // Inventory (Protected by requireRole)
  app.get('/api/inventory', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const inv = await getInventoryStatus();
      res.json(inv);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to load inventory data.');
    }
  });

  app.patch('/api/inventory/:foodItemId', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
    try {
      const updated = await updateInventoryStock(Number(req.params.foodItemId), req.body);
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to update inventory item.');
    }
  });

  // Notifications
  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const notifs = await getUserNotifications(req.currentUser!.id, req.currentUser!.role);
      res.json(notifs);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to retrieve notifications.');
    }
  });

  app.patch('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const updated = await markNotificationRead(Number(req.params.id), req.currentUser!.id, req.currentUser!.role);
      res.json(updated);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to mark notification as read.');
    }
  });

  app.post('/api/notifications/mark-all-read', requireAuth, async (req: AuthRequest, res) => {
    try {
      await markNotificationRead(0, req.currentUser!.id, req.currentUser!.role);
      res.json({ success: true });
    } catch (error: any) {
      handleApiError(res, error, 'Unable to mark notifications as read.');
    }
  });

  // Analytics Dashboard (Admin Only)
  app.get('/api/analytics/dashboard', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const analytics = await getAnalyticsDashboardData();
      res.json(analytics);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to load analytics dashboard.');
    }
  });

  // Smart Canteen Intelligence (Powered by AIService abstraction with circuit breaker & fallback)
  app.get('/api/intelligence', async (req, res) => {
    try {
      const intelligence = await getSmartCanteenIntelligence();
      res.json(intelligence);
    } catch (error: any) {
      handleApiError(res, error, 'Unable to fetch canteen intelligence data.');
    }
  });

  // AI Assistant for Students (Protected with aiRateLimiter)
  app.post('/api/ai/assistant', aiRateLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: 'Bad Request', message: 'Please provide a valid question.' });
      }

      const answer = await aiService.askStudentAssistant(query.trim(), {
        userName: req.currentUser?.name,
      });
      res.json(answer);
    } catch (error: any) {
      // Return polite fallback answer even if everything fails - never 500 to student
      res.json({
        answer: 'The AI assistant is temporarily resting. Please check the menu above or ask the canteen staff at Counter 1.',
        source: 'fallback',
        suggestions: ['View Menu', 'Track My Token', 'Counter Timings'],
      });
    }
  });

  // Vite middleware for development & static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart College Canteen Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
