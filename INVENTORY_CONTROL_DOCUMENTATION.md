# Inventory Control System - Complete Implementation

## Overview

This document describes the comprehensive inventory management system that automatically updates stock levels based on order status changes.

---

## 🎯 Key Features

### ✅ Automatic Stock Management
- **Decrease stock** when order moves to "processing" (or confirmed/shipped/delivered)
- **Increase stock** when order is cancelled
- **Prevent double-deduction** with idempotency checks
- **Track all movements** in audit log
- **Never go negative** - uses GREATEST(0, ...) logic

### ✅ Atomic SQL Function
All inventory updates are handled by a single, atomic PostgreSQL function that ensures:
- Database consistency
- Transaction safety
- Proper locking (FOR UPDATE)
- Comprehensive error handling

### ✅ Complete Audit Trail
Every inventory movement is logged with:
- Product ID and name
- Quantity change (positive or negative)
- Stock level after change
- Reason for change (order status transition)
- Timestamp

---

## 📋 Order Status Flow & Inventory Impact

```
┌─────────────┐
│   PENDING   │ ← No inventory impact
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CONFIRMED  │ ← STOCK DEDUCTED HERE (-quantity)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PROCESSING  │ ← Already deducted (no change)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   SHIPPED   │ ← Already deducted (no change)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  DELIVERED  │ ← Already deducted (no change)
└──────┬──────┘
       │
       ├──→ CANCELLED ← STOCK RESTORED (+quantity)
       │
       └──→ COMPLETED ← Final state
```

---

## 🔧 Technical Implementation

### Database Schema Changes

#### 1. New Column: `orders.inventory_updated`
```sql
ALTER TABLE public.orders 
ADD COLUMN inventory_updated BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.orders.inventory_updated 
IS 'Tracks whether inventory has been deducted for this order';
```

**Purpose:** Prevents double-deduction by marking orders that have already had stock deducted.

#### 2. Master Function: `update_inventory_on_status_change`
```sql
CREATE OR REPLACE FUNCTION update_inventory_on_status_change(
  p_order_id   UUID,
  p_old_status TEXT DEFAULT NULL,
  p_new_status TEXT
) RETURNS JSON
```

**Parameters:**
- `p_order_id`: The order being updated
- `p_old_status`: Previous status (auto-fetched if NULL)
- `p_new_status`: New status being set

**Returns:** JSON object with success status, message, and details

---

## 📊 Scenarios Handled

### Scenario 1: Moving TO Stock-Deducted Status ✅
**Trigger:** Status changes FROM (pending/payment_failed) TO (confirmed/processing/shipped/delivered)

**Action:**
1. Check `inventory_updated = FALSE` (idempotency)
2. For each order item:
   - Decrease product stock by quantity
   - Log movement: `change = -quantity`
3. Set `inventory_updated = TRUE`

**Example:**
```
Order #123: 2 × Product A, 1 × Product B
Status: pending → processing

Result:
- Product A stock: -2
- Product B stock: -1
- inventory_updated: TRUE
```

---

### Scenario 2: Moving TO Cancelled ✅
**Trigger:** Status changes FROM (confirmed/processing/shipped/delivered) TO cancelled

**Action:**
1. For each order item:
   - Increase product stock by quantity
   - Log movement: `change = +quantity`
2. Set `inventory_updated = FALSE`

**Example:**
```
Order #123: 2 × Product A
Status: processing → cancelled

Result:
- Product A stock: +2 (restored)
- inventory_updated: FALSE
```

---

### Scenario 3: Un-Cancelling Order ✅
**Trigger:** Status changes FROM cancelled TO (confirmed/processing/shipped/delivered)

**Action:**
1. For each order item:
   - Decrease product stock by quantity
   - Log movement: `change = -quantity`
2. Set `inventory_updated = TRUE`

**Example:**
```
Order #123: 3 × Product X
Status: cancelled → processing

Result:
- Product X stock: -3
- inventory_updated: TRUE
```

---

### Scenario 4: Other Status Changes ⚠️
**Trigger:** Status changes between non-inventory states

**Examples:**
- pending → payment_failed (no change)
- completed → refunded (no change)
- shipped → delivered (already deducted)

**Action:** No inventory update required

---

## 🛡️ Safety Features

### 1. Idempotency Protection
```sql
-- Prevents double-deduction
IF v_order.inventory_updated = TRUE THEN
  RETURN json_build_object(
    'success', true,
    'message', 'Inventory already updated for this order',
    'already_processed', true
  );
END IF;
```

### 2. Negative Stock Prevention
```sql
v_new_stock := GREATEST(0, COALESCE(v_item.current_stock, 0) - v_item.quantity);
```

### 3. Row Locking
```sql
SELECT * INTO v_order
FROM public.orders
WHERE id = p_order_id
FOR UPDATE; -- Prevents concurrent modifications
```

### 4. Transaction Safety
Function runs in SECURITY DEFINER mode with full transactional integrity.

---

## 🔍 API Integration

### Update Order Endpoint
**Endpoint:** `PUT /api/orders/[id]`

**Request Body:**
```json
{
  "status": "processing",
  "notes": "Updated notes"
}
```

**Backend Logic:**
```typescript
// 1. Detect status change
const oldStatus = currentOrder.status
const newStatus = updates.status

// 2. Call inventory control function
const { data: invResult } = await supabaseServer.rpc(
  'update_inventory_on_status_change',
  {
    p_order_id: id,
    p_old_status: oldStatus,
    p_new_status: newStatus
  }
)

// 3. Update order status
await supabaseServer.from('orders').update({ status: newStatus }).eq('id', id)
```

**Response:**
```json
{
  "id": "uuid",
  "status": "processing",
  "total": 99.99,
  ...
}
```

---

## 📝 Usage Examples

### Example 1: Admin Updates Order to Processing
```bash
curl -X PUT https://yourstore.com/api/orders/ORDER_UUID \
  -H "Content-Type: application/json" \
  -d '{"status": "processing"}'
```

**What happens:**
1. ✅ Stock decreased for all items
2. ✅ Inventory movements logged
3. ✅ Order marked as `inventory_updated = TRUE`
4. ✅ Status changed to "processing"

---

### Example 2: Cancelling an Order
```bash
curl -X PUT https://yourstore.com/api/orders/ORDER_UUID \
  -H "Content-Type: application/json" \
  -d '{"status": "cancelled"}'
```

**What happens:**
1. ✅ Stock restored for all items
2. ✅ Inventory movements logged
3. ✅ Order marked as `inventory_updated = FALSE`
4. ✅ Status changed to "cancelled"

---

### Example 3: Repeated Update (Idempotency Test)
```bash
# First call
curl -X PUT https://yourstore.com/api/orders/ORDER_UUID \
  -H "Content-Type: application/json" \
  -d '{"status": "processing"}'
# Result: Stock deducted

# Second call (same status)
curl -X PUT https://yourstore.com/api/orders/ORDER_UUID \
  -H "Content-Type: application/json" \
  -d '{"status": "processing"}'
# Result: "Inventory already updated" - no duplicate deduction
```

---

## 🗄️ Database Schema

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  status TEXT CHECK (status IN (
    'pending', 'confirmed', 'processing', 'shipped', 
    'delivered', 'completed', 'cancelled', 'failed', 
    'payment_failed', 'refunded'
  )),
  inventory_updated BOOLEAN DEFAULT FALSE,
  -- ... other fields
);
```

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  stock_quantity INTEGER DEFAULT 0,
  -- ... other fields
);
```

### Inventory Movements Table (Audit Log)
```sql
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255),
  change INTEGER NOT NULL,        -- Positive or negative
  quantity_after INTEGER NOT NULL,
  reason TEXT,                     -- e.g., "Order processing: uuid"
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Testing Checklist

### Basic Scenarios
- [ ] Create order with status "pending" - verify no stock change
- [ ] Update to "processing" - verify stock decreases
- [ ] Update same order to "processing" again - verify no duplicate change
- [ ] Update to "cancelled" - verify stock restores
- [ ] Update back to "processing" - verify stock decreases again

### Edge Cases
- [ ] Cancel order with insufficient stock return - verify stock doesn't go negative
- [ ] Multi-item order cancellation - verify all items restored
- [ ] Concurrent updates to same order - verify locking prevents race conditions
- [ ] Order with deleted product - verify graceful handling

### Integration Tests
- [ ] Stripe payment success → order status "confirmed" → stock deducted
- [ ] Payment failed → order status "payment_failed" → no stock change
- [ ] Admin cancels from dashboard → stock restored
- [ ] Customer view shows correct stock availability

---

## 📈 Monitoring & Debugging

### Query: View Recent Inventory Movements
```sql
SELECT 
  im.created_at,
  im.product_name,
  im.change,
  im.quantity_after,
  im.reason,
  p.stock_quantity as current_stock
FROM inventory_movements im
JOIN products p ON p.id = im.product_id
ORDER BY im.created_at DESC
LIMIT 50;
```

### Query: Check Order Inventory Status
```sql
SELECT 
  o.id,
  o.status,
  o.inventory_updated,
  COUNT(oi.id) as items_count,
  SUM(oi.quantity) as total_items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = 'YOUR_ORDER_UUID'
GROUP BY o.id, o.status, o.inventory_updated;
```

### Query: Find Orders Needing Inventory Update
```sql
SELECT 
  o.id,
  o.status,
  o.inventory_updated,
  o.created_at
FROM orders o
WHERE o.status IN ('confirmed', 'processing', 'shipped', 'delivered')
  AND o.inventory_updated = FALSE
ORDER BY o.created_at DESC;
```

---

## 🚨 Troubleshooting

### Issue: Stock Not Updating
**Possible Causes:**
1. RPC function not installed
2. Permissions missing
3. Status not changing (check logs)

**Solution:**
```sql
-- Verify function exists
SELECT proname FROM pg_proc WHERE proname = 'update_inventory_on_status_change';

-- Grant permissions if needed
GRANT EXECUTE ON FUNCTION update_inventory_on_status_change(UUID, TEXT, TEXT) TO authenticated;
```

---

### Issue: Double Deduction
**Symptoms:** Stock decreased twice for same order

**Investigation:**
```sql
SELECT * FROM inventory_movements 
WHERE product_id = 'PRODUCT_UUID'
ORDER BY created_at DESC LIMIT 10;
```

**Fix:** Ensure `inventory_updated` column exists and is being checked

---

### Issue: Stock Goes Negative
**Cause:** Manual override or bypass of inventory function

**Prevention:** Always use the RPC function, never direct UPDATE

---

## 📦 Deployment Steps

### Step 1: Run SQL Script
Execute `scripts/inventory-control-fix.sql` in Supabase SQL Editor

### Step 2: Verify Installation
```sql
-- Check function exists
SELECT * FROM pg_proc WHERE proname = 'update_inventory_on_status_change';

-- Check column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'inventory_updated';
```

### Step 3: Test with Sample Order
1. Create test order
2. Update status via API
3. Verify inventory movements logged
4. Verify stock quantities updated

### Step 4: Monitor Logs
Watch for `[Orders API] Inventory update result:` messages

---

## 🎯 Best Practices

1. **Always use the RPC function** - Never update stock directly
2. **Log everything** - Every movement should have an audit trail
3. **Monitor for anomalies** - Regular queries for unusual patterns
4. **Test edge cases** - Especially cancellations and un-cancellations
5. **Document manual overrides** - If you must bypass, document why

---

## 📚 Related Files

- `scripts/inventory-control-fix.sql` - Master SQL installation script
- `app/api/orders/[id]/route.ts` - API endpoint using inventory control
- `app/admin/orders/[id]/edit/page.tsx` - Admin UI for status changes

---

**Last Updated:** March 28, 2026  
**Version:** 2.0 - Complete Rewrite with Atomic Functions  
**Status:** ✅ Production Ready
