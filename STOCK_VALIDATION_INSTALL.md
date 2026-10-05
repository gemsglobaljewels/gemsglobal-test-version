# Stock Validation System - Installation & Deployment Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Database Function (REQUIRED)

The inventory control system requires running one SQL script in your Supabase database.

**Instructions:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Copy entire content from `scripts/inventory-control-fix.sql`
6. Paste into SQL Editor
7. Click **"Run"** or press `Ctrl+Enter`

**Expected Result:**
```
✅ Success. No rows returned
Function update_inventory_on_status_change created
Table inventory_movements ready
```

**Verify Installation:**
```sql
-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'update_inventory_on_status_change';

-- Should return 1 row
```

---

### Step 2: Verify Database Schema

Make sure your database has the required columns:

```sql
-- Check orders table has inventory_updated column
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name = 'inventory_updated';

-- Should return: inventory_updated

-- If missing, add it:
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS inventory_updated BOOLEAN DEFAULT FALSE;
```

---

### Step 3: Deploy Frontend Code

All code changes are already in your project. Just ensure:

**Files Present:**
- ✅ `components/ProductCard.jsx` (updated)
- ✅ `lib/authStore.ts` (updated)
- ✅ `app/api/stock-check/route.ts` (new)
- ✅ `app/cart/page.tsx` (updated)
- ✅ `app/api/checkout/route.ts` (updated)
- ✅ `scripts/inventory-control-fix.sql` (new)

**No Additional Configuration Needed!**

---

### Step 4: Test the System

#### Test 1: Homepage Stock Validation

```
1. Go to homepage (http://localhost:3000)
2. Find a product with stock = 0
3. Try clicking "Add to Bag"
4. Expected: Error toast "Out of Stock"
```

#### Test 2: Cart Quantity Validation

```
1. Add a product to cart (stock > 0)
2. Go to cart page
3. Click "+" to increase quantity beyond available stock
4. Expected: Error toast "Only X pieces available"
```

#### Test 3: Checkout Backend Validation

```
1. Add out-of-stock product to cart
2. Try to checkout
3. Expected: Error page "Product is unavailable"
```

#### Test 4: Inventory Update (Full Flow)

```
1. Create a test order with status = 'pending'
2. Check product stock (note the value)
3. Update order status: pending → processing
4. Check product stock again
5. Expected: Stock decreased by ordered quantity
6. Check inventory_movements table for audit log
```

---

## 📋 Detailed Testing Commands

### Check Current Stock Levels
```sql
SELECT id, name, stock_quantity, updated_at
FROM products
ORDER BY stock_quantity ASC
LIMIT 10;
```

### View Recent Inventory Movements
```sql
SELECT 
  product_name,
  change,
  quantity_after,
  reason,
  created_at
FROM inventory_movements
ORDER BY created_at DESC
LIMIT 20;
```

### Test Order Status Update
```sql
-- Create a test order
INSERT INTO orders (email, status, total_price, payment_method, inventory_updated)
VALUES ('test@example.com', 'pending', 99.99, 'cod', FALSE)
RETURNING id;

-- Add test order item (replace with actual product ID)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
VALUES ('ORDER_UUID_HERE', 'PRODUCT_UUID_HERE', 2, 49.99);

-- Update order status to trigger inventory update
UPDATE orders 
SET status = 'processing' 
WHERE id = 'ORDER_UUID_HERE';

-- Check product stock changed
SELECT stock_quantity FROM products WHERE id = 'PRODUCT_UUID_HERE';

-- Check inventory movement logged
SELECT * FROM inventory_movements 
WHERE reason LIKE '%Order processing%'
ORDER BY created_at DESC LIMIT 1;
```

---

## 🔧 Troubleshooting

### Issue: SQL function creation fails

**Error:** `function already exists`

**Solution:**
```sql
-- Drop existing function first
DROP FUNCTION IF EXISTS update_inventory_on_status_change(UUID, TEXT, TEXT);

-- Then re-run the creation script
```

---

### Issue: Stock not updating after order

**Check 1:** Is the function installed?
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'update_inventory_on_status_change';
```

**Check 2:** Is order status in correct list?
```sql
-- These statuses trigger stock deduction
SELECT 'confirmed', 'processing', 'shipped', 'delivered', 'completed';

-- Your order status should be one of these
SELECT status FROM orders WHERE id = 'your-order-id';
```

**Check 3:** Is inventory_updated already TRUE?
```sql
SELECT inventory_updated FROM orders WHERE id = 'your-order-id';
-- If TRUE, function skips (prevents double-update)
```

---

### Issue: Frontend validation not working

**Check Browser Console:**
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors related to:
   - /api/stock-check
   - addToCart
   - handleQty
```

**Verify API Endpoint:**
```
1. Open Network tab in DevTools
2. Try adding product to cart
3. Look for request to /api/stock-check
4. Should return JSON with stock_quantity field
```

**Clear Cache:**
```bash
# In browser console
localStorage.clear();
location.reload();
```

---

## 🎯 Production Deployment Checklist

Before deploying to production:

### Database
- [ ] SQL script executed in production Supabase
- [ ] `inventory_updated` column exists in `orders` table
- [ ] `inventory_movements` table created
- [ ] Function verified with test query

### Frontend
- [ ] All modified files committed to git
- [ ] Build passes without errors (`npm run build`)
- [ ] Environment variables configured
- [ ] API routes accessible in production

### Testing
- [ ] Tested out-of-stock prevention
- [ ] Tested cart quantity validation
- [ ] Tested checkout backend validation
- [ ] Tested inventory update on order status change
- [ ] Verified audit logging in `inventory_movements`

### Monitoring
- [ ] Set up alerts for low stock products
- [ ] Monitor `/api/stock-check` response times
- [ ] Watch for inventory update errors in logs
- [ ] Review `inventory_movements` daily

---

## 📊 Monitoring Queries (Production)

### Daily Stock Changes
```sql
SELECT 
  DATE(created_at) AS date,
  SUM(CASE WHEN change < 0 THEN change ELSE 0 END) AS total_deducted,
  SUM(CASE WHEN change > 0 THEN change ELSE 0 END) AS total_restored,
  COUNT(*) AS movement_count
FROM inventory_movements
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Products Running Low (Stock < 5)
```sql
SELECT id, name, stock_quantity, updated_at
FROM products
WHERE stock_quantity BETWEEN 0 AND 5
ORDER BY stock_quantity ASC;
```

### Orders Awaiting Inventory Update
```sql
SELECT id, status, inventory_updated, created_at
FROM orders
WHERE inventory_updated = FALSE
  AND status IN ('confirmed', 'processing', 'shipped', 'delivered', 'completed')
ORDER BY created_at DESC;
```

### Top Stock Consumers (Last 30 Days)
```sql
SELECT 
  product_name,
  SUM(ABS(change)) AS total_sold,
  COUNT(*) AS order_count
FROM inventory_movements
WHERE change < 0 
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY product_name
ORDER BY total_sold DESC
LIMIT 10;
```

---

## 🔐 Backup & Recovery

### Manual Stock Adjustment

If you need to manually fix stock levels:

```sql
-- WARNING: Use only in emergencies
-- Always log manual adjustments

-- 1. Update stock
UPDATE products 
SET stock_quantity = 100,  -- New correct value
    updated_at = NOW()
WHERE id = 'product-uuid';

-- 2. Log the manual adjustment
INSERT INTO inventory_movements (
  product_id,
  product_name,
  change,
  quantity_after,
  reason,
  created_at
) VALUES (
  'product-uuid',
  'Product Name',
  50,  -- Positive for addition, negative for deduction
  100, -- Final stock level
  'Manual adjustment by admin',
  NOW()
);
```

### Restore Stock After System Failure

```sql
-- If inventory updates failed, you can manually trigger
SELECT update_inventory_on_status_change(
  'order-uuid',      -- p_order_id
  'pending',         -- p_old_status
  'processing'       -- p_new_status
);
```

---

## 📞 Support

### Common Error Messages

**"Failed to check stock"**
- Check if `/api/stock-check` endpoint is running
- Verify Supabase connection in environment variables

**"Inventory RPC error"**
- Ensure SQL function is installed
- Check that order UUID exists

**"Cannot read property 'stock_quantity' of undefined"**
- Product might be deleted
- Check API response in network tab

### Getting Help

1. Check logs: `[Checkout]`, `[Cart]`, `[Orders API]`
2. Review this documentation
3. Run diagnostic SQL queries above
4. Check Supabase dashboard for database errors

---

## ✅ Verification Summary

After installation, you should have:

**Database:**
- ✅ Function `update_inventory_on_status_change()` exists
- ✅ Table `inventory_movements` exists
- ✅ Column `inventory_updated` in `orders` table

**Frontend:**
- ✅ Homepage shows "Out of Stock" badges
- ✅ Cannot add out-of-stock items to cart
- ✅ Cart quantity validation works
- ✅ Clear error messages for users

**Backend:**
- ✅ `/api/stock-check` endpoint responds
- ✅ Checkout validates all items
- ✅ Orders API calls inventory RPC
- ✅ Audit trail in `inventory_movements`

**Production Ready:** 🎉

---

## Next Steps

1. ✅ Run SQL installation script
2. ✅ Verify all components present
3. ✅ Test with sample orders
4. ✅ Deploy to production
5. ✅ Monitor for first 24 hours
6. ✅ Set up low-stock alerts

Your stock validation system is now fully operational! 🚀
