-- Add UPI as a supported payment method explicitly
ALTER TYPE payment_method_enum ADD VALUE IF NOT EXISTS 'upi';
