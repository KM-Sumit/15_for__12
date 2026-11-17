-- External payment page link (set by the platform super admin).
ALTER TABLE "institutes" ADD COLUMN IF NOT EXISTS "payment_link" text;
