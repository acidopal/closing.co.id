CREATE TABLE "meta_ads_adsets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ads_account_id" UUID NOT NULL,
    "campaign_ref_id" UUID NOT NULL,
    "adset_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20),
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_ads_adsets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meta_ads_ads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ads_account_id" UUID NOT NULL,
    "campaign_ref_id" UUID,
    "adset_ref_id" UUID,
    "ad_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20),
    "creative_id" VARCHAR(50),
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_ads_ads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meta_ctwa_attributions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "contact_id" UUID,
    "inbox_id" UUID,
    "touch_count" INTEGER NOT NULL DEFAULT 0,
    "first_touch_at" TIMESTAMPTZ(6),
    "last_touch_at" TIMESTAMPTZ(6),
    "first_message_id" UUID,
    "last_message_id" UUID,
    "first_external_message_id" VARCHAR(255),
    "last_external_message_id" VARCHAR(255),
    "first_idempotency_key" VARCHAR(255),
    "last_idempotency_key" VARCHAR(255),
    "processed_idempotency_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "first_ctwa_clid" VARCHAR(255),
    "last_ctwa_clid" VARCHAR(255),
    "first_source_id" VARCHAR(255),
    "last_source_id" VARCHAR(255),
    "first_source_type" VARCHAR(50),
    "last_source_type" VARCHAR(50),
    "first_fb_account_id" VARCHAR(50),
    "last_fb_account_id" VARCHAR(50),
    "first_fb_campaign_id" VARCHAR(50),
    "last_fb_campaign_id" VARCHAR(50),
    "first_fb_adset_id" VARCHAR(50),
    "last_fb_adset_id" VARCHAR(50),
    "first_fb_ad_id" VARCHAR(50),
    "last_fb_ad_id" VARCHAR(50),
    "first_account_name" VARCHAR(255),
    "last_account_name" VARCHAR(255),
    "first_campaign_name" VARCHAR(255),
    "last_campaign_name" VARCHAR(255),
    "first_adset_name" VARCHAR(255),
    "last_adset_name" VARCHAR(255),
    "first_ad_name" VARCHAR(255),
    "last_ad_name" VARCHAR(255),
    "first_referral_payload" JSONB,
    "last_referral_payload" JSONB,
    "metadata" JSONB DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_ctwa_attributions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meta_capi_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_id" UUID NOT NULL,
    "dataset_id" VARCHAR(100) NOT NULL,
    "access_token" TEXT NOT NULL,
    "test_event_code" VARCHAR(100),
    "qualified_stage_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "purchase_stage_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_capi_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meta_capi_event_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "app_id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "contact_id" UUID,
    "meta_ctwa_attribution_id" UUID,
    "event_id" VARCHAR(255) NOT NULL,
    "event_name" VARCHAR(100) NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "event_time" TIMESTAMPTZ(6) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(50) DEFAULT 'pending',
    "response" JSONB,
    "error_message" TEXT,
    "http_status" INTEGER,
    "retry_count" INTEGER DEFAULT 0,
    "delivery_attempted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meta_capi_event_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meta_ads_adsets_campaign_ref_id_adset_id_key"
ON "meta_ads_adsets"("campaign_ref_id", "adset_id");

CREATE INDEX "idx_meta_ads_adsets_acc"
ON "meta_ads_adsets"("ads_account_id");

CREATE INDEX "idx_meta_ads_adsets_campaign"
ON "meta_ads_adsets"("campaign_ref_id");

CREATE UNIQUE INDEX "meta_ads_ads_ads_account_id_ad_id_key"
ON "meta_ads_ads"("ads_account_id", "ad_id");

CREATE INDEX "idx_meta_ads_ads_campaign"
ON "meta_ads_ads"("campaign_ref_id");

CREATE INDEX "idx_meta_ads_ads_adset"
ON "meta_ads_ads"("adset_ref_id");

CREATE INDEX "idx_meta_ads_ads_acc"
ON "meta_ads_ads"("ads_account_id");

CREATE UNIQUE INDEX "meta_ctwa_attributions_conversation_id_key"
ON "meta_ctwa_attributions"("conversation_id");

CREATE INDEX "idx_meta_ctwa_attr_app"
ON "meta_ctwa_attributions"("app_id");

CREATE INDEX "idx_meta_ctwa_attr_contact"
ON "meta_ctwa_attributions"("contact_id");

CREATE INDEX "idx_meta_ctwa_attr_last_touch"
ON "meta_ctwa_attributions"("last_touch_at");

CREATE INDEX "idx_meta_ctwa_attr_last_ctwa_clid"
ON "meta_ctwa_attributions"("last_ctwa_clid");

CREATE UNIQUE INDEX "meta_capi_configs_app_id_key"
ON "meta_capi_configs"("app_id");

CREATE INDEX "idx_meta_capi_configs_active"
ON "meta_capi_configs"("is_active");

CREATE UNIQUE INDEX "ux_meta_capi_event_logs_event_id"
ON "meta_capi_event_logs"("event_id");

CREATE UNIQUE INDEX "ux_meta_capi_event_logs_idempotency"
ON "meta_capi_event_logs"("app_id", "idempotency_key");

CREATE INDEX "idx_meta_capi_event_logs_conversation"
ON "meta_capi_event_logs"("conversation_id");

CREATE INDEX "idx_meta_capi_event_logs_app_event"
ON "meta_capi_event_logs"("app_id", "event_name");

CREATE INDEX "idx_meta_capi_event_logs_status"
ON "meta_capi_event_logs"("status");

ALTER TABLE "meta_ads_adsets"
ADD CONSTRAINT "meta_ads_adsets_ads_account_id_fkey"
FOREIGN KEY ("ads_account_id") REFERENCES "meta_ads_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "meta_ads_adsets"
ADD CONSTRAINT "meta_ads_adsets_campaign_ref_id_fkey"
FOREIGN KEY ("campaign_ref_id") REFERENCES "meta_ads_campaigns"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "meta_ads_ads"
ADD CONSTRAINT "meta_ads_ads_ads_account_id_fkey"
FOREIGN KEY ("ads_account_id") REFERENCES "meta_ads_accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "meta_ads_ads"
ADD CONSTRAINT "meta_ads_ads_campaign_ref_id_fkey"
FOREIGN KEY ("campaign_ref_id") REFERENCES "meta_ads_campaigns"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "meta_ads_ads"
ADD CONSTRAINT "meta_ads_ads_adset_ref_id_fkey"
FOREIGN KEY ("adset_ref_id") REFERENCES "meta_ads_adsets"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "meta_ctwa_attributions"
ADD CONSTRAINT "meta_ctwa_attributions_app_id_fkey"
FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "meta_ctwa_attributions"
ADD CONSTRAINT "meta_ctwa_attributions_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "meta_ctwa_attributions"
ADD CONSTRAINT "meta_ctwa_attributions_contact_id_fkey"
FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "meta_capi_configs"
ADD CONSTRAINT "meta_capi_configs_app_id_fkey"
FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "meta_capi_event_logs"
ADD CONSTRAINT "meta_capi_event_logs_app_id_fkey"
FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "meta_capi_event_logs"
ADD CONSTRAINT "meta_capi_event_logs_conversation_id_fkey"
FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "meta_capi_event_logs"
ADD CONSTRAINT "meta_capi_event_logs_contact_id_fkey"
FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "meta_capi_event_logs"
ADD CONSTRAINT "meta_capi_event_logs_meta_ctwa_attribution_id_fkey"
FOREIGN KEY ("meta_ctwa_attribution_id") REFERENCES "meta_ctwa_attributions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
