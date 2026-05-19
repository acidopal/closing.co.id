ALTER TABLE "ai_settings"
ALTER COLUMN "model_provider" SET DEFAULT 'growthcircle';

ALTER TABLE "ai_settings"
ALTER COLUMN "model_name" SET DEFAULT 'gpt-5.5';

UPDATE "ai_settings"
SET "model_provider" = 'growthcircle'
WHERE "model_provider" IS NULL
	OR BTRIM("model_provider") = ''
	OR LOWER("model_provider") = 'openai';

UPDATE "ai_settings"
SET "model_name" = 'gpt-5.5'
WHERE "model_name" IS NULL
	OR BTRIM("model_name") = ''
	OR LOWER("model_name") = 'gpt-4o-mini';

INSERT INTO "platform_settings" ("key", "value")
VALUES (
	'ai.provider.config.growthcircle',
	'{"provider":"growthcircle","base_url":"https://ai.growthcircle.id/v1","model_name":"gpt-5.5"}'
)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "platform_settings" ("key", "value")
VALUES ('ai.provider.active', 'growthcircle')
ON CONFLICT ("key") DO UPDATE
SET
	"value" = EXCLUDED."value",
	"updated_at" = NOW();
