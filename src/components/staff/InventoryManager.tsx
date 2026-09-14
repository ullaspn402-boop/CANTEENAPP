import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const { authHeaders } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const addStock = async (foodItemId: number, additionalStock: number) => {
    setUpdatingId(foodItemId);
    const existing = items.find((i) => i.foodItemId === foodItemId);
    if (!existing) return;

    try {
      const res = await fetch(`/api/inventory/${foodItemId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          availableStock: existing.availableStock + additionalStock,
          dailyPrepared: existing.dailyPrepared + additionalStock,
        }),
      });
      if (res.ok) {
        await fetchInventory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Inventory & Daily Kitchen Preparation</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Track daily batch portions, sold counts, and restock items to prevent midday shortages.
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stock
        </button>
      </div>

      {loading ? (
        <div className="h-64 bg-neutral-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Dish Name</th>
                  <th className="p-4 text-center">Diet</th>
                  <th className="p-4 text-center">Daily Prepared</th>
                  <th className="p-4 text-center">Sold Today</th>
                  <th className="p-4 text-center">Remaining Stock</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {items.map((item) => {
                  const isLow = item.availableStock <= item.reorderLevel;
                  const isCritical = item.availableStock === 0;

                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="p-4 font-bold text-neutral-900">
                        <div className="text-sm">{item.name}</div>
                        <div className="text-[11px] text-neutral-400 font-normal">₹{item.price} per {item.unit}</div>
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.isVeg ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.isVeg ? 'VEG' : 'NON-VEG'}
                        </span>
                      </td>

                      <td className="p-4 text-center text-neutral-700 font-semibold">
                        {item.dailyPrepared} {item.unit}s
                      </td>

                      <td className="p-4 text-center text-neutral-700 font-semibold">
                        {item.dailySold} {item.unit}s
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg font-black text-sm ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.availableStock}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Low Stock (&lt;{item.reorderLevel})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Adequate
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => addStock(item.foodItemId, 10)}
                            disabled={updatingId === item.foodItemId}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg border border-amber-200 transition-colors shadow-2xs"
                            title="Add 10 more portions"
                          >
                            +10 {item.unit}s
                          </button>
                          <button
                            onClick={() => addStock(item.foodItemId, 25)}
                            disabled={updatingId === item.foodItemId}
                            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg transition-colors shadow-2xs"
                            title="Add 25 more portions"
                          >
                            +25
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
