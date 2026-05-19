# Requirements Document

## Introduction

This document specifies the requirements for completing the Instagram DM integration feature. The system already supports WhatsApp messaging end-to-end. Instagram has partial backend support (OAuth flow, token refresh, webhook routing, outbound sending) but lacks inbound message processing, frontend channel management UI, media handling, and contact/conversation creation from Instagram DMs. These requirements capture what must be built to bring Instagram to feature parity with the WhatsApp integration pattern.

## Glossary

- **Inbound_Processor**: The backend worker function (`handleInstagramInbound`) that parses Instagram webhook payloads and stores incoming DM messages, contacts, and conversations.
- **Media_Handler**: The utility function (`persistInstagramMediaToS3`) that downloads Instagram media from CDN URLs and uploads them to S3 storage.
- **Content_Extractor**: The pure function (`extractInstagramMessageContent`) that maps Instagram message objects to internal content types and attributes.
- **Inbox_Resolver**: The function (`findInstagramInbox`) that matches a webhook recipient ID to an active Instagram inbox record.
- **Channel_Page**: The frontend React page (`instagram.tsx`) that allows users to connect, view, and manage Instagram DM channels.
- **Instagram_Service**: The backend service class (`InstagramService`) providing channel listing, status, deletion, and OAuth callback handling.
- **Outbound_Worker**: The existing BullMQ worker that sends outbound messages via the Graph API.
- **Webhook_Event**: A database record in `webhook_events` that logs raw webhook payloads and their processing status.
- **Channel_Config**: The JSON field on the `inboxes` table storing Instagram-specific configuration (tokens, IDs, username).
- **IGSID**: Instagram-scoped user ID, the unique identifier for a user within Instagram's messaging platform (received as `sender.id` in webhooks).
- **Graph_API**: Facebook's Graph API (v23.0) used for OAuth, message sending, and media access.
- **Messaging_Window**: The 24-hour window after a user's last inbound message during which the system can send responses.

## Requirements

### Requirement 1: Inbound Message Processing

**User Story:** As a support agent, I want Instagram DMs to appear in my inbox automatically, so that I can respond to customers who message us on Instagram.

#### Acceptance Criteria

1. WHEN an Instagram webhook payload is received containing message events, THE Inbound_Processor SHALL parse each entry's `messaging` array and process every message event individually.
2. WHEN a message event has `is_echo` set to true, THE Inbound_Processor SHALL skip the event without creating an incoming message record.
3. WHEN a message event is a read receipt or delivery confirmation (contains `read` or `delivery` fields), THE Inbound_Processor SHALL skip the event without creating a message record.
4. WHEN a message event has a valid `sender.id` and `recipient.id`, THE Inbound_Processor SHALL resolve the recipient ID to an active Instagram inbox by matching against `channel_config.instagram_id` or `channel_config.fb_page_id`.
5. WHEN the recipient ID does not match any active inbox, THE Inbound_Processor SHALL increment the `unknownChannel` counter and log an error message identifying the unmatched recipient ID.
6. WHEN a valid message event is processed, THE Inbound_Processor SHALL create a message record with `external_id` set to the message's `mid` value.
7. WHEN processing completes for a webhook payload, THE Inbound_Processor SHALL return stats where `messagesCreated + duplicates + unknownChannel + errors` equals the total number of message events encountered.
8. WHEN a `webhookEventId` is provided, THE Inbound_Processor SHALL update the corresponding Webhook_Event status to `processed` if any messages were created or deduplicated, or `failed` if all events resulted in errors.

### Requirement 2: Message Deduplication

**User Story:** As a system operator, I want duplicate webhook deliveries to be handled gracefully, so that customers never see duplicate messages in their conversations.

#### Acceptance Criteria

1. WHEN storing an inbound message, THE Inbound_Processor SHALL acquire a PostgreSQL advisory lock on `hashtext(mid)` before checking for existing records.
2. WHEN a message with the same `mid` already exists in the database, THE Inbound_Processor SHALL return a `duplicate` status and create no new message record.
3. WHEN two workers attempt to process the same `mid` concurrently, THE Inbound_Processor SHALL ensure exactly one message record is created through the advisory lock mechanism.

### Requirement 3: Contact Management

**User Story:** As a support agent, I want Instagram users who message us to be automatically created as contacts, so that I can see their conversation history and details.

#### Acceptance Criteria

1. WHEN an inbound message is received from a sender, THE Inbound_Processor SHALL upsert a contact record with `instagram_igsid` set to the sender's IGSID and `app_id` set to the inbox's app ID.
2. WHEN creating a new contact, THE Inbound_Processor SHALL set the `identifier` field to the format `ig:{app_id}:{igsid}`.
3. WHEN updating an existing contact, THE Inbound_Processor SHALL update `last_inbound_message_at`, `last_message_at`, and `window_expires_at` to reflect the current message timestamp.
4. WHEN a contact is created or updated, THE Inbound_Processor SHALL set `window_expires_at` to the message timestamp plus 24 hours.
5. WHEN a contact is created or updated, THE Inbound_Processor SHALL set `channel_type` to `instagram` and `source` to `instagram_webhook` for new contacts.

### Requirement 4: Conversation Management

**User Story:** As a support agent, I want Instagram DMs to be organized into conversations, so that I can track and manage each customer interaction.

#### Acceptance Criteria

1. WHEN an inbound message is received for a contact, THE Inbound_Processor SHALL find an existing open conversation for that contact and inbox, or create a new one if none exists.
2. WHEN creating a new conversation, THE Inbound_Processor SHALL set `channel_type` to `instagram`, `status` to `open`, and link it to the correct `inbox_id` and `contact_id`.
3. WHEN a message is stored in a conversation, THE Inbound_Processor SHALL increment the conversation's `unread_count` by one and update `last_message_at` and `last_activity_at`.
4. WHEN a message is stored in a conversation, THE Inbound_Processor SHALL set `messaging_window_expires_at` to the message timestamp plus 24 hours and set `messaging_window_open` to true.

### Requirement 5: Content Type Extraction

**User Story:** As a support agent, I want to see the correct content type for each Instagram message (text, image, video, etc.), so that I can understand what the customer sent.

#### Acceptance Criteria

1. WHEN a message contains only text and no attachments, THE Content_Extractor SHALL return `contentType` as `text` and `content` as the message text.
2. WHEN a message contains an attachment, THE Content_Extractor SHALL map the attachment type to the internal content type using the mapping: `image→image`, `video→video`, `audio→audio`, `file→document`, `share→link`, `story_mention→story_mention`, `reel→reel`.
3. WHEN a message contains an attachment, THE Content_Extractor SHALL include the attachment URL in `contentAttributes.media.url`.
4. WHEN a message contains an attachment but no text, THE Content_Extractor SHALL set `content` to `[{attachment_type}]` as a placeholder.
5. WHEN a message is a reply (has `reply_to` field), THE Content_Extractor SHALL include `reply_to.mid` in the `contentAttributes`.
6. THE Content_Extractor SHALL return a non-null `content` string for every input, falling back to an empty string if no text or attachments are present.

### Requirement 6: Media Handling

**User Story:** As a support agent, I want Instagram media attachments (images, videos, audio) to be stored reliably, so that I can view them even after Instagram CDN links expire.

#### Acceptance Criteria

1. WHEN an inbound message contains a media attachment, THE Media_Handler SHALL download the media from the Instagram CDN URL.
2. WHEN uploading media to S3, THE Media_Handler SHALL use the key format `{appId}/instagram/{inboxId}/{messageId}/{filename}`.
3. WHEN media is successfully uploaded, THE Media_Handler SHALL create a `media_files` record with `platform` set to `instagram` and `download_status` set to `downloaded`.
4. IF a media download fails, THEN THE Media_Handler SHALL return null and the message SHALL still be created with the original CDN URL preserved in `content_attributes`.
5. WHEN detecting the file type, THE Media_Handler SHALL read the MIME type from the HTTP response headers of the download.

### Requirement 7: Inbox Resolution

**User Story:** As a system operator, I want webhook payloads to be correctly routed to the right Instagram channel, so that messages appear in the correct inbox.

#### Acceptance Criteria

1. WHEN resolving an inbox for a recipient ID, THE Inbox_Resolver SHALL search for active, non-deleted inboxes where `channel_config.instagram_id` or `channel_config.fb_page_id` matches the recipient ID.
2. WHEN an inbox is found, THE Inbox_Resolver SHALL return the inbox ID, app ID, and channel configuration including `access_token`, `page_access_token`, and `fb_page_id`.
3. WHEN no matching inbox is found, THE Inbox_Resolver SHALL return null without modifying any database records.

### Requirement 8: Frontend Channel Management

**User Story:** As an account administrator, I want a dedicated Instagram channels page, so that I can connect, view, and manage Instagram DM integrations.

#### Acceptance Criteria

1. WHEN a user navigates to the Instagram channels page, THE Channel_Page SHALL display a list of connected Instagram channels with username, profile picture, active status, and token expiry information.
2. WHEN a user clicks "Connect Instagram", THE Channel_Page SHALL initiate the OAuth flow by requesting a login URL from the backend and opening it in a popup window.
3. WHEN the OAuth flow completes successfully, THE Channel_Page SHALL refresh the channel list to show the newly connected channel.
4. WHEN a channel's token expires within 7 days, THE Channel_Page SHALL display a warning indicator to the user.
5. WHEN a user clicks disconnect on a channel, THE Channel_Page SHALL call the delete endpoint and remove the channel from the displayed list.
6. THE Channel_Page SHALL follow the same layout and interaction patterns as the existing WhatsApp channels page.

### Requirement 9: Instagram Service Enhancements

**User Story:** As a developer, I want the Instagram backend service to support channel listing and use the current Graph API version, so that the frontend can display channels and API calls are reliable.

#### Acceptance Criteria

1. THE Instagram_Service SHALL provide a `getChannels` method that returns all active, non-deleted Instagram inboxes for a given app ID.
2. THE Instagram_Service SHALL provide a `getChannelById` method that returns a single Instagram inbox by its ID.
3. WHEN making Graph API calls for OAuth token exchange, THE Instagram_Service SHALL use Graph API version v23.0 instead of v19.0.
4. WHEN making Graph API calls for page discovery, THE Instagram_Service SHALL use Graph API version v23.0 instead of v19.0.
5. WHEN refreshing tokens, THE Instagram_Service SHALL use Graph API version v23.0 instead of v19.0.

### Requirement 10: Realtime Event Emission

**User Story:** As a support agent, I want new Instagram DMs to appear in real time without refreshing the page, so that I can respond to customers promptly.

#### Acceptance Criteria

1. WHEN a new inbound message is successfully stored, THE Inbound_Processor SHALL emit a `message:created` event via Socket.IO to the appropriate app room.
2. WHEN emitting the realtime event, THE Inbound_Processor SHALL include the message data, conversation ID, contact information, and channel name.

### Requirement 11: Webhook Event Lifecycle

**User Story:** As a system operator, I want webhook events to be tracked from receipt through processing, so that I can monitor and debug message delivery issues.

#### Acceptance Criteria

1. WHEN an Instagram webhook payload is received, THE system SHALL create a Webhook_Event record with `source` set to `instagram`, `event_type` set to `message.received`, and `status` set to `pending`.
2. WHEN processing completes, THE Inbound_Processor SHALL update the Webhook_Event with `processed_at` timestamp, resolved `app_id`, and resolved `inbox_id`.
3. IF all message events in a payload result in errors, THEN THE Inbound_Processor SHALL set the Webhook_Event status to `failed` with error messages truncated to 1000 characters.

### Requirement 12: Outbound Message Sending

**User Story:** As a support agent, I want to reply to Instagram DMs from the inbox, so that I can respond to customer inquiries on Instagram.

#### Acceptance Criteria

1. WHEN an outbound message is queued for an Instagram conversation, THE Outbound_Worker SHALL read `page_id` and `access_token` from the inbox's Channel_Config.
2. WHEN sending an outbound message, THE Outbound_Worker SHALL use the contact's `instagram_id` or `instagram_igsid` as the recipient ID.
3. WHEN the Graph API returns a successful response, THE Outbound_Worker SHALL update the message status to `sent` and store the returned `message_id` as `external_id`.
4. IF the Graph API returns an error, THEN THE Outbound_Worker SHALL update the message status to `failed` and store the error details.

### Requirement 13: OAuth Connection Flow

**User Story:** As an account administrator, I want to connect my Instagram Business account via Facebook Login, so that the system can receive and send DMs on my behalf.

#### Acceptance Criteria

1. WHEN initiating the OAuth flow, THE Instagram_Service SHALL construct a Facebook Login URL with scopes `instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments`, `pages_show_list`, and `pages_read_engagement`.
2. WHEN the OAuth callback is received with a valid code, THE Instagram_Service SHALL exchange it for a short-lived token, then exchange that for a long-lived token with approximately 60-day expiry.
3. WHEN discovering the Instagram Business Account, THE Instagram_Service SHALL query the user's Facebook Pages and find the page linked to an Instagram Business Account.
4. IF no Instagram Business Account is found linked to the user's Facebook Pages, THEN THE Instagram_Service SHALL return a descriptive error message.
5. WHEN storing the connection, THE Instagram_Service SHALL upsert an inbox record with `channel_type` set to `instagram` and Channel_Config containing `instagram_id`, `username`, `access_token`, `page_access_token`, `token_expires_at`, and `fb_page_id`.

### Requirement 14: Token Refresh

**User Story:** As a system operator, I want Instagram access tokens to be refreshed automatically before they expire, so that the integration remains functional without manual intervention.

#### Acceptance Criteria

1. WHEN the token refresh job runs, THE Instagram_Service SHALL find all active Instagram inboxes with tokens expiring within 7 days.
2. WHEN refreshing a token, THE Instagram_Service SHALL exchange the current long-lived token for a new long-lived token via the Graph API and update the Channel_Config with the new token and expiry date.
3. IF a token refresh fails for a specific inbox, THEN THE Instagram_Service SHALL log the error and continue refreshing tokens for remaining inboxes.
