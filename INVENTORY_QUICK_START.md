# Inventory Control - Quick Start Guide

## 🚀 Installation (5 minutes)

### Step 1: Run SQL Script
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `scripts/inventory-control-fix.sql`
3. Paste and run
4. Verify success message

**That's it!** The system is now installed.

---

## ✅ What You Get

### Automatic Stock Updates
```
Order Status → Processing = Stock Decreases (-quantity)
Order Status → Cancelled   = Stock Increases (+quantity)
```

### Complete Audit Trail
Every stock change is logged with:
- Which product
- How much changed
- Why it changed
- Current stock level

### Safety Features
✅ No double-deduction  
✅ No negative stock  
✅ Handles concurrent updates  
✅ Transaction-safe  

---

## 🎯 How It Works

### Flow Diagram
```
Customer places order
    ↓
Status: "pending" (no stock change)
    ↓
Admin marks "processing"
    ↓
📦 Stock automatically decreases
    ↓
Logged in inventory_movements
    ↓
Order marked as "inventory_updated = TRUE"
```

### Cancellation Flow
```
Order: "processing" → "cancelled"
    ↓
📦 Stock automatically increases
    ↓
Logged in inventory_movements
    ↓
Order marked as "inventory_updated = FALSE"
```

---

## 🧪 Quick Test

### Test 1: Basic Stock Deduction
```sql
-- Check current stock
SELECT name, stock_quantity FROM products WHERE id = 'YOUR_PRODUCT_ID';

-- Update an order to processing
UPDATE orders SET status = 'processing' WHERE id = 'YOUR_ORDER_ID';

-- Check stock again (should be lower)
SELECT name, stock_quantity FROM products WHERE id = 'YOUR_PRODUCT_ID';

-- View the movement log
SELECT * FROM inventory_movements 
WHERE product_id = 'YOUR_PRODUCT_ID' 
ORDER BY created_at DESC LIMIT 5;
```

### Test 2: Cancellation & Restore
```sql
-- Cancel the order
UPDATE orders SET status = 'cancelled' WHERE id = 'YOUR_ORDER_ID';

-- Check stock (should be restored)
SELECT name, stock_quantity FROM products WHERE id = 'YOUR_PRODUCT_ID';

-- View restoration in log
SELECT * FROM inventory_movements 
WHERE product_id = 'YOUR_PRODUCT_ID' 
ORDER BY created_at DESC LIMIT 5;
```

---

## 📊 Common Scenarios

### Scenario Table

| From Status | To Status      | Stock Action          | Example Use Case           |
|-------------|----------------|-----------------------|----------------------------|
| pending     | confirmed      | **Decrease** (-qty)   | Payment successful         |
| pending     | processing     | **Decrease** (-qty)   | Direct to fulfillment      |
| confirmed   | processing     | No change             | Normal workflow            |
| processing  | shipped        | No change             | Package dispatched         |
| shipped     | delivered      | No change             | Customer received          |
| ANY         | cancelled      | **Increase** (+qty)   | Customer cancels           |
| cancelled   | processing     | **Decrease** (-qty)   | Reinstated order           |
| pending     | payment_failed | No change             | Payment declined           |

---

## 🔍 Monitoring Queries

### Recent Inventory Movements
```sql
SELECT 
  im.created_at,
  im.product_name,
  im.change,
  im.quantity_after,
  im.reason
FROM inventory_movements im
ORDER BY im.created_at DESC
LIMIT 20;
```

### Low Stock Alert
```sql
SELECT name, stock_quantity 
FROM products 
WHERE stock_quantity < 5
ORDER BY stock_quantity ASC;
```

### Orders Needing Attention
```sql
SELECT 
  o.id,
  o.status,
  o.inventory_updated,
  o.created_at
FROM orders o
WHERE o.status IN ('confirmed', 'processing')
  AND o.inventory_updated = FALSE;
```

---

## ⚠️ Important Notes

### DO:
✅ Use admin dashboard to update order status  
✅ Let the system handle inventory automatically  
✅ Check inventory_movements for audit trail  

### DON'T:
❌ Manually UPDATE products.stock_quantity  
❌ Bypass the RPC function  
❌ Delete inventory_movements records  

---

## 🐛 Troubleshooting

### Stock Not Updating?
1. Check if SQL script was run successfully
2. Verify permissions: `GRANT EXECUTE ON FUNCTION ...`
3. Check server logs for RPC errors

### Double Deduction?
- Should not happen with `inventory_updated` flag
- If it does, check function installation

### Negative Stock?
- System uses `GREATEST(0, ...)` to prevent this
- If you see negative, something bypassed the system

---

## 📞 Support

**Full Documentation:** See `INVENTORY_CONTROL_DOCUMENTATION.md`

**SQL Script:** `scripts/inventory-control-fix.sql`

**API Code:** `app/api/orders/[id]/route.ts`

---

## Next Steps

1. ✅ Install SQL function
2. ✅ Test with sample order
3. ✅ Train admin team on status updates
4. ✅ Set up low-stock alerts
5. ✅ Monitor inventory movements

---

**Installation Time:** ~5 minutes  
**Complexity:** ⭐ Easy (just run SQL)  
**Impact:** 💯 Complete automation  

Your inventory is now fully automated! 🎉
