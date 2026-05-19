# Implementation Plan: Instagram DM Integration

## Overview

Complete the Instagram DM integration by replacing the inbound processing stub, adding content extraction and media handling, enhancing the Instagram service with channel listing and Graph API v23.0, fixing the OAuth callback for popup flow, and building the frontend channel management page. All work follows the established WhatsApp integration pattern.

## Tasks

- [x] 1. Implement core inbound message processing
  - [x] 1.1 Add `findInstagramInbox` helper function in `apps/backend/src/modules/webhook/service.ts`
    - Query `inboxes` where `channel_type = 'instagram'`, `is_active = true`, `deleted_at = null`
    - Match `channel_config.instagram_id` OR `channel_config.fb_page_id` against the recipient ID
    - Return inbox id, app_id, name, and channel_config fields (access_token, page_access_token, fb_page_id, instagram_id, username, profile_picture_url) or null
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 1.2 Add `extractInstagramMessageContent` pure function in `apps/backend/src/modules/webhook/service.ts`
    - For text-only messages (no attachments): return `contentType: 'text'`, `content: message.text`
    - Map attachment types: `image→image`, `video→video`, `audio→audio`, `file→document`, `share→link`, `story_mention→story_mention`, `reel→reel`
    - Include `contentAttributes.media.url` from `attachment.payload.url` when attachments present
    - Set `content` to `[{type}]` placeholder when attachment present but no text
    - Include `reply_to.mid` in contentAttributes when `message.reply_to` exists
    - Always return non-null `content` string, fallback to empty string
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 1.3 Write property test for `extractInstagramMessageContent`
    - **Property 7: Content extraction completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6**

  - [x] 1.4 Add `persistInstagramMediaToS3` function in `apps/backend/src/modules/webhook/service.ts`
    - Download media from Instagram CDN URL (use page_access_token for auth if needed)
    - Read MIME type from HTTP response headers
    - Upload to S3 with key format `{appId}/instagram/{inboxId}/{messageId}/{filename}`
    - Create `media_files` record with `platform: 'instagram'`, `download_status: 'downloaded'`
    - Return null on failure without throwing; preserve original CDN URL in content_attributes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 1.5 Write property test for `persistInstagramMediaToS3` success path
    - **Property 8: Media persistence on success**
    - **Validates: Requirements 6.2, 6.3**

- [x] 2. Checkpoint - Ensure helper functions compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Replace `handleInstagramInbound` stub with full implementation
  - [x] 3.1 Implement `storeIncomingInstagramMessage` private method in `apps/backend/src/modules/webhook/service.ts`
    - Upsert contact with `instagram_igsid = sender.id`, `identifier = ig:{app_id}:{igsid}`, `channel_type = 'instagram'`, `source = 'instagram_webhook'`
    - Set `window_expires_at` to message timestamp + 24 hours on contact
    - Find existing open conversation for contact+inbox or create new one with `channel_type: 'instagram'`, `status: 'open'`
    - Increment `unread_count`, update `last_message_at`, `last_activity_at`, set `messaging_window_expires_at` to timestamp + 24h, `messaging_window_open: true`
    - Call `extractInstagramMessageContent` and `persistInstagramMediaToS3` for media
    - Use `pg_advisory_xact_lock(hashtext(mid))` for deduplication within a transaction
    - Create message record with `external_id = mid`, `message_type: 'incoming'`, `sender_type: 'contact'`
    - Create `media_files` record inside transaction if media upload succeeded
    - Return `{ status: 'created' }` with message/contact/conversation data, or `{ status: 'duplicate' }`
    - _Requirements: 1.1, 1.6, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

  - [x] 3.2 Replace the `handleInstagramInbound` stub in `apps/backend/src/modules/webhook/service.ts`
    - Parse `payload.entry[].messaging[]` array
    - Skip events with `is_echo: true`, `read`, `delivery` fields, or missing `sender`/`recipient`
    - Call `findInstagramInbox` for each event's `recipient.id`
    - Increment `unknownChannel` counter and log error when no inbox found
    - Call `storeIncomingInstagramMessage` for valid events
    - Track stats: `messagesCreated`, `duplicates`, `unknownChannel`, `errors`
    - Update `webhook_events` record: status `processed` or `failed`, set `processed_at`, `app_id`, `inbox_id`, truncate errors to 1000 chars
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 11.1, 11.2, 11.3_

  - [x] 3.3 Add `emitInstagramMessageCreatedEvent` to emit `message:created` via Socket.IO
    - Emit to `app:{appId}` and `conversation:{conversationId}` rooms
    - Include message data, conversation ID, contact info, channel name, and `channel_type: 'instagram'`
    - _Requirements: 10.1, 10.2_

  - [ ]* 3.4 Write property test for stats conservation invariant
    - **Property 1: Stats conservation invariant**
    - **Validates: Requirements 1.7**

  - [ ]* 3.5 Write property test for event filtering
    - **Property 2: Event filtering**
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 3.6 Write property test for message deduplication
    - **Property 3: Message deduplication (idempotence)**
    - **Validates: Requirements 2.2**

  - [ ]* 3.7 Write property test for contact creation correctness
    - **Property 4: Contact creation correctness**
    - **Validates: Requirements 3.1, 3.2, 3.5**

  - [ ]* 3.8 Write property test for messaging window calculation
    - **Property 5: Messaging window calculation**
    - **Validates: Requirements 3.4, 4.4**

  - [ ]* 3.9 Write property test for conversation creation and update
    - **Property 6: Conversation creation and update**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 4. Checkpoint - Ensure inbound processing compiles and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Enhance Instagram backend service and routes
  - [x] 5.1 Add `getChannels` and `getChannelById` methods to `InstagramService` in `apps/backend/src/modules/instagram/service.ts`
    - `getChannels(appId)`: return all inboxes where `channel_type = 'instagram'`, `is_active = true`, `deleted_at = null`, `app_id = appId`
    - `getChannelById(inboxId)`: return single inbox by ID
    - _Requirements: 9.1, 9.2_

  - [x] 5.2 Upgrade Graph API version from v19.0 to v23.0 in `InstagramService`
    - Update `handleCallback`: change all `graph.facebook.com/v19.0/` URLs to `v23.0`
    - Update `refreshTokens`: change `graph.facebook.com/v19.0/` URL to `v23.0`
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 5.3 Add GET `/` route to Instagram module in `apps/backend/src/modules/instagram/index.ts`
    - Call `InstagramService.getChannels(resolvedAppId)` and return `{ data: channels }`
    - Require `resolvedAppId`, return 400 if missing
    - _Requirements: 9.1_

  - [x] 5.4 Fix OAuth callback in `apps/backend/src/modules/instagram/index.ts` to return HTML with `postMessage` for popup flow
    - On success: return HTML that calls `window.opener.postMessage({ type: 'INSTAGRAM_CONNECTED', inboxId }, '*')` then closes popup
    - On error: return HTML that calls `window.opener.postMessage({ type: 'IG_ERROR', reason }, '*')` then closes popup
    - Follow the same pattern as the WhatsApp callback in `apps/backend/src/modules/whatsapp/index.ts`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 5.5 Write property test for channel listing filter correctness
    - **Property 13: Channel listing filter correctness**
    - **Validates: Requirements 9.1**

- [x] 6. Checkpoint - Ensure backend service enhancements compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Build frontend Instagram channel page
  - [x] 7.1 Update `apps/frontend/src/routes/$lang/$appId/channels/instagram/index.tsx` to use the new `GET /instagram-channels` endpoint
    - Fetch channels from `${API_BASE}/instagram-channels` instead of filtering all inboxes client-side
    - Display username, profile picture, active status from channel_config
    - Show token expiry warning when `daysUntilTokenExpiry < 7` (call `GET /instagram-channels/:id/status`)
    - Handle OAuth popup `postMessage` callback (`INSTAGRAM_CONNECTED` and `IG_ERROR` types)
    - Add disconnect functionality calling `DELETE /instagram-channels/:id`
    - Follow same layout and interaction patterns as `whatsapp.tsx`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 7.2 Write property test for token expiry warning threshold
    - **Property 12: Token expiry warning threshold**
    - **Validates: Requirements 8.4**

- [x] 8. Wire everything together and verify integration
  - [x] 8.1 Verify the `init-login` endpoint in `apps/backend/src/modules/instagram/index.ts` uses v23.0 for the OAuth dialog URL
    - Update `https://www.facebook.com/v19.0/dialog/oauth` to `v23.0`
    - _Requirements: 9.3_

  - [ ]* 8.2 Write property test for webhook event lifecycle
    - **Property 10: Webhook event lifecycle**
    - **Validates: Requirements 1.8, 11.1, 11.2**

  - [ ]* 8.3 Write property test for external ID preservation
    - **Property 11: External ID preservation**
    - **Validates: Requirements 1.6**

  - [ ]* 8.4 Write property test for inbox resolution correctness
    - **Property 9: Inbox resolution correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check and validate universal correctness properties from the design document
- The outbound flow (Req 12) and token refresh (Req 14) already work and don't need new implementation tasks
