import { buildMobileApiUrl } from '../config/api';
import { Category, FoodItem, Order, CanteenStatus } from '../types';

let authToken: string | null = null;
let activeRole: string = '';

export function setMobileAuthSession(token: string | null, role: string = '') {
  authToken = token;
  activeRole = role;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

export async function fetchCanteenStatus(): Promise<CanteenStatus> {
  try {
    const res = await fetch(buildMobileApiUrl('/api/canteen/status'), {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch canteen status');
    return await res.json();
  } catch (err) {
    return {
      isOpen: true,
      currentWaitTimeMinutes: 8,
      announcement: 'Fresh hot meals being prepared today!',
    };
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(buildMobileApiUrl('/api/categories'), {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch food categories');
  return await res.json();
}

export async function fetchFoodItems(params?: {
  categoryId?: number;
  isVeg?: boolean;
  search?: string;
  sortBy?: string;
}): Promise<FoodItem[]> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.append('categoryId', params.categoryId.toString());
  if (params?.isVeg !== undefined) query.append('isVeg', params.isVeg.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.sortBy) query.append('sortBy', params.sortBy);

  const url = buildMobileApiUrl(`/api/food-items?${query.toString()}`);
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch menu items');
  return await res.json();
}

export async function createStudentOrder(
  items: Array<{ foodItemId: number; quantity: number }>,
  specialInstructions?: string
): Promise<Order> {
  // Mobile client idempotency key
  const idempotencyKey = `mobile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const res = await fetch(buildMobileApiUrl('/api/orders'), {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      items,
      specialInstructions,
      idempotencyKey,
    }),
  });

  if (!res.ok) {
    let message = 'Failed to create order.';
    try {
      const err = await res.json();
      message = err.message || err.error || message;
    } catch {}
    throw new Error(message);
  }

  return await res.json();
}

export async function fetchMyOrders(): Promise<Order[]> {
  const res = await fetch(buildMobileApiUrl('/api/orders/my-orders'), {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch order history');
  return await res.json();
}

export async function trackOrderByToken(tokenNumber: string): Promise<Order> {
  const res = await fetch(buildMobileApiUrl(`/api/orders/track/${tokenNumber}`), {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Order not found');
  return await res.json();
}

export async function submitOrderFeedback(
  orderId: number,
  rating: number,
  comment?: string,
  foodItemId?: number
) {
  const res = await fetch(buildMobileApiUrl(`/api/orders/${orderId}/feedback`), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ rating, comment, foodItemId }),
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return await res.json();
}

export async function askAIAssistant(query: string): Promise<{ answer: string; source: string; suggestions?: string[] }> {
  try {
    const res = await fetch(buildMobileApiUrl('/api/ai/assistant'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Graceful offline fallback
  }

  return {
    answer: 'Welcome to the Smart College Canteen! Counter 1 is open for digital token pickups. Let me know what you crave today!',
    source: 'offline_fallback',
    suggestions: ['Check wait time', 'Today Special Combo', 'Track my token'],
  };
}

export async function fetchStaffOrders(status?: string): Promise<Order[]> {
  const query = status ? `?status=${status}` : '';
  const res = await fetch(buildMobileApiUrl(`/api/staff/orders${query}`), {
    headers: getHeaders(),
  });
  if (!res.ok) {
    let message = 'Failed to fetch staff orders.';
    try {
      const err = await res.json();
      message = err.message || err.error || message;
    } catch {}
    throw new Error(message);
  }
  return await res.json();
}

export async function updateOrderStatus(orderId: number, status: string): Promise<Order> {
  const res = await fetch(buildMobileApiUrl(`/api/staff/orders/${orderId}/status`), {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    let message = 'Failed to update order status.';
    try {
      const err = await res.json();
      message = err.message || err.error || message;
    } catch {}
    throw new Error(message);
  }
  return await res.json();
}
