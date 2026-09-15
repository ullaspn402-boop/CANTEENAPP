// Vercel Serverless Function Entry Point for CampusBite API
// This wraps the Express app for Vercel's serverless environment.
// The Vite frontend is served as static files from the dist/ folder.

import express, { type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import process from 'node:process';
import { requireAuth, requireRole, totalAuthFailures } from '../src/middleware/auth.ts';
import type { AuthRequest } from '../src/middleware/auth.ts';
import {
  generalRateLimiter,
  authRateLimiter,
  orderCreationRateLimiter,
  aiRateLimiter,
  orderTrackingRateLimiter,
  totalRateLimitEvents,
} from '../src/middleware/rateLimit.ts';
import { seedDatabase } from '../src/db/seed.ts';
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
  getAllReviewsList,
  voteReviewHelpful,
  getInventoryStatus,
  updateInventoryStock,
  getUserNotifications,
  markNotificationRead,
  getAnalyticsDashboardData,
  getSmartCanteenIntelligence,
} from '../src/db/queries.ts';
import { sql } from 'drizzle-orm';
import { db } from '../src/db/index.ts';
import { updateUserRole, demoteUserToStudent, promoteUserToAdmin } from '../src/db/users.ts';
import {
  getOfficialCanteenProfile,
  registerOfficialCanteen,
  isOfficialCanteenAccount,
  transferOfficialCanteenEmail,
  updateOfficialCanteenLocation,
  updateCampusCoverage,
} from '../src/db/canteenProfile.ts';
import {
  requestOldEmailSecretCode,
  verifyOldEmailSecretCode,
  requestNewEmailSecretCode,
  finalizeEmailTransferWithCodes,
  getRecentSecurityDispatches,
} from '../src/services/verificationCodeService.ts';
import { addFallbackNotification } from '../src/db/fallbackData.ts';
import { aiService } from '../src/services/ai/aiService.ts';

let totalBackendErrors = 0;

function handleApiError(res: Response, error: any, defaultUserMsg: string = 'An unexpected error occurred. Please try again.') {
  totalBackendErrors++;
  const rawMessage: string = error?.message || '';
  console.error('[API Error]:', error);

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
    return res.status(400).json({ error: 'Bad Request', message: rawMessage });
  }

  if (rawMessage.includes('Inventory race condition')) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Item was just reserved by another customer. Please review your tray and try again.',
    });
  }

  return res.status(500).json({ error: 'Internal Server Error', message: defaultUserMsg });
}

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.set('trust proxy', 1);

const allowedOrigins = [
  ...(process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:5173']),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : []),
  ...(process.env.APP_URL ? [process.env.APP_URL.trim()] : []),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://10.0.2.2:') ||
        origin.startsWith('exp://') ||
        origin.endsWith('.vercel.app') ||
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

// Seamlessly handle paths whether prefixed with /api or stripped by serverless rewrites
app.use((req, res, next) => {
  if (!req.url.startsWith('/api/') && req.url !== '/api') {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

app.use('/api/', generalRateLimiter);

// Initialize DB schema & seed on first cold start
let dbInitialized = false;
async function ensureDbInit() {
  if (!dbInitialized) {
    dbInitialized = true;
    try {
      await ensureDatabaseSchema();
      await seedDatabase();
    } catch (err) {
      console.error('Error during DB initialization:', err);
    }
  }
}
ensureDbInit();

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'campusbite-api', timestamp: new Date().toISOString() });
});

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
  if (aiTelemetry.circuitState === 'OPEN') aiStatus = 'UNAVAILABLE';
  else if (aiTelemetry.circuitState === 'HALF-OPEN' || aiTelemetry.fallbackCount > 0) aiStatus = 'DEGRADED';

  res.json({
    status: dbStatus === 'HEALTHY' ? 'HEALTHY' : 'DEGRADED',
    components: { coreApplication: 'HEALTHY', database: dbStatus, aiProvider: aiStatus },
    aiTelemetry,
    metrics: { totalRateLimitEvents, totalAuthFailures, totalBackendErrors, uptimeSeconds: Math.round(process.uptime()) },
    timestamp: new Date().toISOString(),
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.get('/api/auth/me', requireAuth, authRateLimiter, (req: AuthRequest, res) => {
  if (req.currentUser && !isOfficialCanteenAccount(req.currentUser.email)) {
    req.currentUser.role = 'student';
  }
  res.json({ user: req.currentUser });
});

app.post('/api/auth/role', requireAuth, async (req: AuthRequest, res) => {
  const { role } = req.body;
  if (!['student', 'staff', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Supported: student, staff, admin' });
  }
  if ((role === 'staff' || role === 'admin') && !isOfficialCanteenAccount(req.currentUser?.email)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access Denied: Only the verified official canteen account can access the Staff or Administrator portal.',
    });
  }
  if (req.currentUser) {
    req.currentUser.role = role;
    await updateUserRole(req.currentUser.uid, role, req.currentUser.email);
  }
  res.json({ success: true, role, user: req.currentUser });
});

// ─── Canteen Profile ──────────────────────────────────────────────────────────
app.get('/api/canteen/official-profile', async (req, res) => {
  try {
    res.json(getOfficialCanteenProfile());
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
    if (!result.success) return res.status(400).json({ error: 'Verification Failed', message: result.error });
    if (req.currentUser && isOfficialCanteenAccount(req.currentUser.email)) {
      req.currentUser.role = 'admin';
      await updateUserRole(req.currentUser.uid, 'admin');
    }
    res.json(result);
  } catch (error: any) {
    handleApiError(res, error, 'Failed to register official canteen account.');
  }
});

app.post('/api/canteen/transfer-official-email', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { newEmail, passcode } = req.body;
    const currentOfficial = getOfficialCanteenProfile();
    const oldEmail = currentOfficial.officialEmail;
    const transferResult = transferOfficialCanteenEmail({ oldEmail, newEmail, passcode });
    if (!transferResult.success) return res.status(400).json({ error: 'Transfer Failed', message: transferResult.error });
    await demoteUserToStudent(oldEmail);
    await promoteUserToAdmin(newEmail);
    if (req.currentUser && req.currentUser.email.trim().toLowerCase() === oldEmail.trim().toLowerCase()) {
      req.currentUser.role = 'student';
    }
    addFallbackNotification({
      userId: req.currentUser?.id || 1,
      title: 'Official Canteen Account Transferred',
      message: `Canteen management authority was successfully transferred from "${oldEmail}" to "${newEmail}".`,
      type: 'order_status',
    });
    res.json({ success: true, message: `Official canteen ownership transferred to ${newEmail}.`, oldOfficialEmail: oldEmail, newOfficialEmail: newEmail, profile: transferResult.profile });
  } catch (error: any) {
    handleApiError(res, error, 'Failed to transfer official canteen email.');
  }
});

app.put('/api/canteen/location', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { latitude, longitude, campusName, radiusMeters, address } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Validation Error', message: 'Valid numerical latitude and longitude are required.' });
    }
    const updatedProfile = updateOfficialCanteenLocation({ latitude, longitude, campusName, radiusMeters: radiusMeters ? Number(radiusMeters) : undefined, address });
    res.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    handleApiError(res, error, 'Unable to update canteen GPS location.');
  }
});

app.put('/api/canteen/coverage', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { radiusMeters, campusZones } = req.body;
    const updated = updateCampusCoverage(Number(radiusMeters) || 5000, campusZones);
    res.json({ success: true, profile: updated });
  } catch (error: any) {
    handleApiError(res, error, 'Unable to update campus area coverage.');
  }
});

// ─── 2-Step Email Transfer ────────────────────────────────────────────────────
app.post('/api/canteen/transfer/request-old-code', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { email, passcode } = req.body;
    const result = requestOldEmailSecretCode({ email, passcode });
    if (!result.success) return res.status(400).json({ error: 'Verification Request Failed', message: result.error });
    res.json(result);
  } catch (error: any) {
    handleApiError(res, error, 'Failed to generate old email secret code.');
  }
});

app.post('/api/canteen/transfer/verify-old-code', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { email, code } = req.body;
    const result = verifyOldEmailSecretCode({ email, code });
    if (!result.success) return res.status(400).json({ error: 'Code Verification Failed', message: result.error });
    res.json(result);
  } catch (error: any) {
    handleApiError(res, error, 'Failed to verify old email secret code.');
  }
});

app.post('/api/canteen/transfer/request-new-code', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { newEmail, transferSessionToken } = req.body;
    const result = requestNewEmailSecretCode({ newEmail, transferSessionToken });
    if (!result.success) return res.status(400).json({ error: 'Activation Request Failed', message: result.error });
    res.json(result);
  } catch (error: any) {
    handleApiError(res, error, 'Failed to generate new Gmail activation code.');
  }
});

app.post('/api/canteen/transfer/complete', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { newEmail, code, transferSessionToken } = req.body;
    const result = await finalizeEmailTransferWithCodes({ newEmail, code, transferSessionToken });
    if (!result.success) return res.status(400).json({ error: 'Transfer Finalization Failed', message: result.error });
    if (req.currentUser) req.currentUser.role = 'student';
    res.json({ success: true, message: result.message, newOfficialEmail: result.newEmail, oldOfficialEmail: result.oldEmail });
  } catch (error: any) {
    handleApiError(res, error, 'Failed to finalize authority transfer.');
  }
});

app.get('/api/canteen/transfer/dispatches', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    res.json(getRecentSecurityDispatches());
  } catch (error: any) {
    handleApiError(res, error, 'Unable to load security dispatches.');
  }
});

// ─── Canteen Status ───────────────────────────────────────────────────────────
app.get('/api/canteen/status', async (req, res) => {
  try {
    res.json(await getCanteenStatus());
  } catch (error: any) {
    handleApiError(res, error, 'Unable to load canteen live status.');
  }
});

app.put('/api/canteen/status', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    res.json(await updateCanteenStatus(req.body));
  } catch (error: any) {
    handleApiError(res, error, 'Unable to update canteen status.');
  }
});

// ─── Categories ───────────────────────────────────────────────────────────────
app.get('/api/categories', async (req, res) => {
  try {
    res.json(await getAllCategories());
  } catch (error: any) {
    handleApiError(res, error, 'Unable to load categories.');
  }
});

// ─── Food Items ───────────────────────────────────────────────────────────────
app.get('/api/food-items', async (req, res) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const isVeg = req.query.isVeg !== undefined ? req.query.isVeg === 'true' : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const sortBy = req.query.sortBy as any;
    const includeInactive = req.query.includeInactive === 'true';
    res.json(await getFoodItemsList({ categoryId, isVeg, search, sortBy, includeInactive }));
  } catch (error: any) {
    handleApiError(res, error, 'Unable to load menu items.');
  }
});

app.post('/api/food-items', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    res.status(201).json(await createFoodItemRecord(req.body));
  } catch (error: any) {
    handleApiError(res, error, 'Failed to create menu item.');
  }
});

app.put('/api/food-items/:id', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    res.json(await updateFoodItemRecord(Number(req.params.id), req.body));
  } catch (error: any) {
    handleApiError(res, error, 'Failed to update menu item.');
  }
});

app.patch('/api/food-items/:id/toggle-active', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { isActive } = req.body;
    res.json(await updateFoodItemRecord(Number(req.params.id), { isActive: Boolean(isActive) }));
  } catch (error: any) {
    handleApiError(res, error, 'Failed to toggle active status.');
  }
});

app.patch('/api/food-items/:id/toggle-availability', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { isAvailable } = req.body;
    res.json(await updateFoodItemRecord(Number(req.params.id), { isAvailable: Boolean(isAvailable) }));
  } catch (error: any) {
    handleApiError(res, error, 'Failed to toggle item availability.');
  }
});

app.patch('/api/food-items/:id/stock', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { availableStock } = req.body;
    res.json(await updateFoodItemRecord(Number(req.params.id), { availableStock: Number(availableStock) }));
  } catch (error: any) {
    handleApiError(res, error, 'Failed to update item stock.');
  }
});

app.delete('/api/food-items/:id', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    res.json(await deleteFoodItemRecord(Number(req.params.id)));
  } catch (error: any) {
    handleApiError(res, error, 'Failed to delete menu item.');
  }
});

// ─── Orders ───────────────────────────────────────────────────────────────────
app.post('/api/orders', orderCreationRateLimiter, requireAuth, async (req: AuthRequest, res) => {
  try {
    const { items, specialInstructions, idempotencyKey } = req.body;
    const keyHeader = (req.headers['idempotency-key'] as string) || idempotencyKey;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Please provide items to order.' });
    }
    res.status(201).json(await createStudentOrder(req.currentUser!.id, items, specialInstructions, keyHeader));
  } catch (error: any) {
    handleApiError(res, error, 'Unable to place order at this time. Please try again.');
  }
});

app.get('/api/orders/my-orders', requireAuth, async (req: AuthRequest, res) => {
  try {
    res.json(await getUserOrdersHistory(req.currentUser!.id));
  } catch (error: any) {
    handleApiError(res, error, 'Unable to retrieve your order history.');
  }
});

app.get('/api/orders/track/:tokenNumber', orderTrackingRateLimiter, async (req, res) => {
  try {
    const order = await getOrderDetailsByToken(req.params.tokenNumber.toUpperCase());
    if (!order) return res.status(404).json({ error: 'Not Found', message: 'Digital token not found or order has expired.' });
    const sanitizedOrder = {
      ...order,
      customerEmail: order.customerEmail ? order.customerEmail.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}***${c}`) : undefined,
      customerPhone: order.customerPhone ? order.customerPhone.replace(/(\d{2,4})\d+(\d{2})/, '$1****$2') : undefined,
    };
    res.json(sanitizedOrder);
  } catch (error: any) {
    handleApiError(res, error, 'Unable to track order token.');
  }
});

// ─── Staff Orders ─────────────────────────────────────────────────────────────
app.get('/api/staff/orders', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    res.json(await getStaffOrdersList(req.query.status as string));
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
    res.json(await updateOrderStatusByStaff(Number(req.params.id), status));
  } catch (error: any) {
    handleApiError(res, error, 'Unable to update order status.');
  }
});

app.patch('/api/staff/orders/:id/payment', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!['paid', 'pay_at_canteen', 'pending'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Invalid payment status specified.' });
    }
    res.json(await updateOrderPaymentStatusByStaff(Number(req.params.id), paymentStatus));
  } catch (error: any) {
    handleApiError(res, error, 'Unable to update order payment status.');
  }
});

// ─── Feedback ─────────────────────────────────────────────────────────────────
app.post('/api/orders/:id/feedback', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { rating, comment, foodItemId } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Bad Request', message: 'Rating must be between 1 and 5 stars.' });
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) return res.status(400).json({ error: 'Bad Request', message: 'Invalid order ID.' });
    const order = await getOrderDetailsById(orderId);
    if (!order) return res.status(404).json({ error: 'Not Found', message: 'Order not found.' });
    if (order.userId !== req.currentUser!.id && req.currentUser!.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only submit feedback for your own orders.' });
    }
    res.status(201).json(await submitOrderFeedback({ orderId, userId: req.currentUser!.id, rating: Number(rating), comment, foodItemId: foodItemId ? Number(foodItemId) : undefined }));
  } catch (error: any) {
    handleApiError(res, error, 'Unable to submit feedback.');
  }
});

app.get('/api/feedback/summary', async (req, res) => {
  try {
    res.json(await getFeedbackSummary());
  } catch (error: any) {
    handleApiError(res, error, 'Unable to load feedback summary.');
  }
});

// ─── Reviews & Ratings System ─────────────────────────────────────────────────
app.get('/api/reviews', async (req, res) => {
  try {
    const ratingParam = req.query.rating ? Number(req.query.rating) : undefined;
    const summary = await getFeedbackSummary();
    const reviews = await getAllReviewsList(ratingParam);
    res.json({
      summary,
      reviews,
    });
  } catch (error: any) {
    handleApiError(res, error, 'Unable to load reviews.');
  }
});

app.post('/api/reviews', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { rating, comment, foodItemId, orderId, tags } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Bad Request', message: 'Rating must be between 1 and 5 stars.' });
    }
    const result = await submitOrderFeedback({
      orderId: orderId ? Number(orderId) : undefined,
      userId: req.currentUser!.id,
      userName: req.currentUser!.name,
      userEmail: req.currentUser!.email,
      rating: Number(rating),
      comment: typeof comment === 'string' ? comment.trim() : '',
      foodItemId: foodItemId ? Number(foodItemId) : undefined,
      tags: Array.isArray(tags) ? tags : [],
    });
    res.status(201).json(result);
  } catch (error: any) {
    handleApiError(res, error, 'Unable to submit review.');
  }
});

app.post('/api/reviews/:id/helpful', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const count = await voteReviewHelpful(id);
    res.json({ helpfulCount: count });
  } catch (error: any) {
    res.json({ helpfulCount: 1 });
  }
});

// ─── Inventory ────────────────────────────────────────────────────────────────
app.get('/api/inventory', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    res.json(await getInventoryStatus());
  } catch (error: any) {
    handleApiError(res, error, 'Unable to load inventory data.');
  }
});

app.patch('/api/inventory/:foodItemId', requireAuth, requireRole(['staff', 'admin']), async (req: AuthRequest, res) => {
  try {
    res.json(await updateInventoryStock(Number(req.params.foodItemId), req.body));
  } catch (error: any) {
    handleApiError(res, error, 'Unable to update inventory item.');
  }
});

// ─── Notifications ────────────────────────────────────────────────────────────
app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    res.json(await getUserNotifications(req.currentUser!.id, req.currentUser!.role));
  } catch (error: any) {
    handleApiError(res, error, 'Unable to retrieve notifications.');
  }
});

app.patch('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    res.json(await markNotificationRead(Number(req.params.id), req.currentUser!.id, req.currentUser!.role));
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

// ─── Analytics ────────────────────────────────────────────────────────────────
app.get('/api/analytics/dashboard', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
  try {
    res.json(await getAnalyticsDashboardData());
  } catch (error: any) {
    handleApiError(res, error, 'Unable to load analytics dashboard.');
  }
});

// ─── AI ───────────────────────────────────────────────────────────────────────
app.get('/api/intelligence', async (req, res) => {
  try {
    res.json(await getSmartCanteenIntelligence());
  } catch (error: any) {
    handleApiError(res, error, 'Unable to fetch canteen intelligence data.');
  }
});

app.post('/api/ai/assistant', aiRateLimiter, requireAuth, async (req: AuthRequest, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'Please provide a valid question.' });
    }
    res.json(await aiService.askStudentAssistant(query.trim(), { userName: req.currentUser?.name }));
  } catch (error: any) {
    res.json({
      answer: 'The AI assistant is temporarily resting. Please check the menu above or ask the canteen staff at Counter 1.',
      source: 'fallback',
      suggestions: ['View Menu', 'Track My Token', 'Counter Timings'],
    });
  }
});

// Export the Express app as the Vercel serverless handler (compatible with both CJS require and ESM import)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
  (module.exports as any).default = app;
}
export default app;
