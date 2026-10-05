# Application Routes and API Reference

## Pages (App Router)

- Public
  - `/` → app/page.tsx
  - `/collection` → app/collection/page.tsx
  - `/collection/[category]/[[...parts]]` → app/collection/[category]/[[...parts]]/page.tsx
  - `/products/[slug]` → app/products/[slug]/page.tsx
  - `/product/[id]` → app/product/[id]/page.tsx
  - `/appointments` → app/appointments/page.tsx
  - `/cart` → app/cart/page.tsx
  - `/checkout` → app/checkout/page.tsx
  - `/order/success` → app/order/success/page.tsx
  - `/login` → app/login/page.tsx
  - `/auth/signin` → app/auth/signin/page.tsx
  - `/auth/signup` → app/auth/signup/page.tsx
  - `/auth/signup-success` → app/auth/signup-success/page.tsx
  - `/account` → app/account/page.tsx

- Admin
  - `/admin` → app/admin/page.tsx
  - `/admin/login` → app/admin/login/page.tsx
  - Products
    - `/admin/products` → app/admin/products/page.tsx
    - `/admin/products/new` → app/admin/products/new/page.tsx
    - `/admin/products/[id]/edit` → app/admin/products/[id]/edit/page.tsx
  - Inventory
    - `/admin/inventory` → app/admin/inventory/page.tsx
  - Orders
    - `/admin/orders` → app/admin/orders/page.tsx
    - `/admin/orders/[id]/edit` → app/admin/orders/[id]/edit/page.tsx
  - Offline Sales
    - `/admin/offline-sales` → app/admin/offline-sales/page.tsx
    - `/admin/offline-sales/new` → app/admin/offline-sales/new/page.tsx
    - `/admin/offline-sales/[id]` → app/admin/offline-sales/[id]/page.tsx
    - `/admin/offline-sales/[id]/edit` → app/admin/offline-sales/[id]/edit/page.tsx
  - Appointments
    - `/admin/appointments` → app/admin/appointments/page.tsx
    - `/admin/appointments/new` → app/admin/appointments/new/page.tsx
    - `/admin/appointments/[id]/edit` → app/admin/appointments/[id]/edit/page.tsx
  - Blog
    - `/admin/blog` → app/admin/blog/page.tsx
    - `/admin/blog/new` → app/admin/blog/new/page.tsx
    - `/admin/blog/[id]/edit` → app/admin/blog/[id]/edit/page.tsx
  - Reports
    - `/admin/reports/ledger` → app/admin/reports/ledger/page.tsx
    - `/admin/reports/ledger/new` → app/admin/reports/ledger/new/page.tsx
    - `/admin/reports/ledger/[id]/edit` → app/admin/reports/ledger/[id]/edit/page.tsx
  - Users
    - `/admin/users` → app/admin/users/page.tsx
    - `/admin/users/[id]` → app/admin/users/[id]/page.tsx
  - Categories
    - `/admin/categories` → app/admin/categories/page.tsx

## API Endpoints

- Users
  - `GET /api/users` → list registered users + guest emails
  - `GET /api/users/:id` → user detail (profile, orders, wishlist count, carts count)

- Analytics
  - `GET /api/analytics/summary` → { usersCount, visitorsCount }

- Categories
  - `GET /api/categories` → list categories (+ product_count)
  - `POST /api/categories` → create category (name, optional slug if column exists)
  - `PUT /api/categories/:id` → update name (and slug if column exists)
  - `DELETE /api/categories/:id` → delete (auto-moves products to “Uncategorized”)

- Products
  - `GET /api/products` → list products (computed fields: price_inr, category slug)
  - `POST /api/products` → create product
  - `GET /api/products/:id` → fetch a product
  - `PUT /api/products/:id` → update product
  - `DELETE /api/products/:id` → delete product (cleans movements, stock; archives if constrained)

- Inventory
  - `POST /api/inventory/adjust` → stock in/out movement
  - `GET /api/inventory/movements` → movement history

- Offline Sales
  - `GET /api/offline-sales` → list sales
  - `POST /api/offline-sales` → create sale
  - `GET /api/offline-sales/:id` → fetch sale
  - `PUT /api/offline-sales/:id` → update sale
  - `DELETE /api/offline-sales/:id` → delete sale

- Orders
  - `GET /api/orders` → list orders
  - `POST /api/orders` → create order
  - `GET /api/orders/:id` → fetch order
  - `PUT /api/orders/:id` → update order
  - `DELETE /api/orders/:id` → delete order

- Wishlist
  - `GET /api/wishlist?userId=…|email=…` → list wishlist items
  - `POST /api/wishlist` → add to wishlist ({ userId|email, productSlug })
  - `DELETE /api/wishlist` → remove from wishlist ({ userId|email, productSlug })

- Cart/Checkout
  - `POST /api/cart` → modify cart (project-specific)
  - `POST /api/checkout` → start checkout (project-specific)

- Storage
  - `POST /api/storage/upload-product-image` → upload/import product image

- Blog
  - `GET /api/blog` · `POST /api/blog`
  - `GET /api/blog/:id` · `PUT /api/blog/:id` · `DELETE /api/blog/:id`

- Ledger
  - `GET /api/ledger` · `POST /api/ledger`
  - `GET /api/ledger/:id` · `PUT /api/ledger/:id` · `DELETE /api/ledger/:id`

- Appointments
  - `GET /api/appointments` · `POST /api/appointments`
  - `GET /api/appointments/:id` · `PUT /api/appointments/:id` · `DELETE /api/appointments/:id`

- Admin Utilities
  - `POST /api/admin/check` → verify admin session
  - `POST /api/admin/promote` → promote user to admin (project-specific)
  - `POST /api/admin/cleanup-demo` → remove demo products

- Currency
  - `GET /api/currency` → USD→INR rate (with fallback)

## Notes

- Dynamic segments:
  - `[id]` → path parameter
  - `[[...parts]]` → optional catch-all
- API methods reflect implemented handlers in each route file.
