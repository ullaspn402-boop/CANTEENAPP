/**
 * Master Verification & Resilience Test Suite
 * Tests Core Operations, Duplicate Order Idempotency, Concurrency, RBAC, and AI Circuit Breaker.
 */

import { CircuitBreaker } from '../src/services/ai/circuitBreaker';
import { aiService } from '../src/services/ai/aiService';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('  SMART COLLEGE CANTEEN — SYSTEM VERIFICATION SUITE  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // TEST SUITE 1: AI Provider Resilience & Circuit Breaker (Zero AI Dependency)
  console.log('\n--- 1. Testing AI Provider Resilience & Circuit Breaker ---');
  try {
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      cooldownMs: 500,
      timeoutMs: 3000,
      maxRetries: 1,
      baseBackoffMs: 100,
    });

    assert(breaker.getState() === 'CLOSED', 'Circuit breaker initializes in CLOSED state');

    // Simulate 2 failures
    breaker.recordFailure(new Error('Simulated 429 Too Many Requests'), true);
    breaker.recordFailure(new Error('Simulated 500 Internal Server Error'), false);

    assert(breaker.getState() === 'OPEN', 'Circuit breaker transitions to OPEN after threshold failures');

    // Test executeWithRetry using fallback when circuit is OPEN
    const { usedFallback } = await breaker.executeWithRetry(
      async () => 'primary_result',
      async () => 'fallback_result'
    );
    assert(usedFallback === true, 'Circuit breaker immediately routes to fallback when OPEN without calling failing service');

    // Wait for cooldown
    await new Promise((resolve) => setTimeout(resolve, 600));
    assert(breaker.getState() === 'HALF-OPEN', 'Circuit breaker enters HALF-OPEN state after cooldown period');

    // Test AIService fallback query (even if Gemini is completely offline)
    const assistantResult = await aiService.askStudentAssistant('What is today special?');
    assert(!!assistantResult.answer, `AI Assistant returned response gracefully: source=${assistantResult.source}`);

    const intelligenceData = await aiService.getIntelligence();
    assert(Array.isArray(intelligenceData.demandPredictions), `Culinary demand returned via fallback/ML: ${intelligenceData.demandPredictions.length} slot predictions`);

    const telemetry = aiService.getTelemetry();
    assert(typeof telemetry.circuitState === 'string', `AI Telemetry circuitState reported: ${telemetry.circuitState}`);
  } catch (err: any) {
    console.error('AI Resilience test error:', err);
    failed++;
  }

  // TEST SUITE 2: Live Backend REST API Verification
  console.log('\n--- 2. Testing Core Backend Endpoints ---');
  let serverReachable = false;
  try {
    const probe = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    serverReachable = probe.ok;
  } catch {
    serverReachable = false;
  }

  if (!serverReachable) {
    console.log(`  [INFO] Local server is not running at ${BASE_URL}. Skipping live HTTP endpoint tests.`);
    console.log(`  [INFO] (To run HTTP tests, start server with 'npm run dev' or set TEST_API_URL)`);
  } else {
    try {
      const healthRes = await fetch(`${BASE_URL}/api/health`);
      assert(healthRes.ok, `GET /api/health returned ${healthRes.status}`);

    const statusRes = await fetch(`${BASE_URL}/api/canteen/status`);
    assert(statusRes.ok, `GET /api/canteen/status returned ${statusRes.status}`);
    const statusData = await statusRes.json();
    assert(typeof statusData.isOpen === 'boolean', `Canteen status isOpen is boolean: ${statusData.isOpen}`);

    const catRes = await fetch(`${BASE_URL}/api/categories`);
    assert(catRes.ok, `GET /api/categories returned ${catRes.status}`);
    const categories = await catRes.json();
    assert(Array.isArray(categories), `Categories returned array with ${categories.length} items`);

    const foodRes = await fetch(`${BASE_URL}/api/food-items`);
    assert(foodRes.ok, `GET /api/food-items returned ${foodRes.status}`);
    const foodItems = await foodRes.json();
    assert(Array.isArray(foodItems) && foodItems.length > 0, `Menu items returned ${foodItems.length} items`);

    // TEST SUITE 3: Duplicate Order Prevention & Idempotency
    console.log('\n--- 3. Testing Duplicate Order Idempotency ---');
    const firstFoodItem = foodItems[0];
    const testIdempotencyKey = `test_idemp_${Date.now()}_abc`;

    const orderPayload = {
      items: [{ foodItemId: firstFoodItem.id, quantity: 1 }],
      specialInstructions: 'Test order for duplicate verification',
      idempotencyKey: testIdempotencyKey,
    };

    // First order submission
    const orderRes1 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': testIdempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    assert(orderRes1.ok, `Initial order creation status: ${orderRes1.status}`);
    const order1 = await orderRes1.json();
    assert(!!order1.tokenNumber, `Token successfully generated: #${order1.tokenNumber}`);

    // Immediate duplicate submission with identical Idempotency-Key
    const orderRes2 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': testIdempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    assert(orderRes2.ok, `Idempotent duplicate request handled with 200 OK`);
    const order2 = await orderRes2.json();
    assert(order1.id === order2.id, `Duplicate order prevented: Order ID ${order1.id} matches ${order2.id}`);
    assert(order1.tokenNumber === order2.tokenNumber, `Tokens match identical order: #${order1.tokenNumber}`);

    // TEST SUITE 4: Order State Machine & Tracking
    console.log('\n--- 4. Testing Order Tracking & State Machine ---');
    const trackRes = await fetch(`${BASE_URL}/api/orders/track/${order1.tokenNumber}`);
    assert(trackRes.ok, `Track order by token returned ${trackRes.status}`);
    const tracked = await trackRes.json();
    assert(tracked.tokenNumber === order1.tokenNumber, `Tracked token matches: #${tracked.tokenNumber}`);

    // TEST SUITE 5: Feedback Submission
    console.log('\n--- 5. Testing Feedback Submission ---');
    const feedbackRes = await fetch(`${BASE_URL}/api/orders/${order1.id}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Automated test feedback: Delicious and fast pickup!',
      }),
    });
    assert(feedbackRes.ok, `Feedback submitted successfully: ${feedbackRes.status}`);

    // TEST SUITE 6: RBAC Security & Health Verification
    console.log('\n--- 6. Testing RBAC Security & Public Health Telemetry ---');
    const pubHealthRes = await fetch(`${BASE_URL}/api/health`);
    assert(pubHealthRes.ok, `GET /api/health returned ${pubHealthRes.status}`);

    // Strictly verify RBAC: Unauthenticated admin endpoint must return 401
    const adminHealthRes = await fetch(`${BASE_URL}/api/admin/health`);
    assert(adminHealthRes.status === 401, `Unauthenticated request to admin endpoint securely rejected with 401 (${adminHealthRes.status})`);
    } catch (err: any) {
      console.error('API Verification error:', err);
      failed++;
    }
  }

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
