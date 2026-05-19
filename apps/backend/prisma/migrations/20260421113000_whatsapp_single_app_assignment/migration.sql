-- Disconnect all currently active WhatsApp channels.
UPDATE "whatsapp_channels"
SET
	"is_active" = FALSE,
	"deleted_at" = COALESCE("deleted_at", NOW()),
	"updated_at" = NOW()
WHERE "deleted_at" IS NULL;

-- Soft-delete WhatsApp inboxes linked to those channels.
UPDATE "inboxes" AS i
SET
	"deleted_at" = COALESCE(i."deleted_at", NOW()),
	"updated_at" = NOW()
WHERE i."deleted_at" IS NULL
	AND i."id" IN (
		SELECT DISTINCT wc."inbox_id"
		FROM "whatsapp_channels" wc
		WHERE wc."inbox_id" IS NOT NULL
	);

-- Enforce 1 active phone_number_id globally (no cross-app duplicates).
CREATE UNIQUE INDEX IF NOT EXISTS "ux_whatsapp_channels_active_phone_number_id"
ON "whatsapp_channels" ("phone_number_id")
WHERE "deleted_at" IS NULL
	AND "phone_number_id" IS NOT NULL
	AND BTRIM("phone_number_id") <> '';
