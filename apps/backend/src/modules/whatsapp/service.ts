import { PutObjectCommand } from '@aws-sdk/client-s3'
import {
	s3,
	BUCKET_NAME,
	buildS3PublicUrl,
	getS3UploadConfigurationError,
} from '../../lib/s3'
import crypto from 'crypto'
import prisma from '../../lib/prisma'
import { resolveAppId, isUuid } from '../../lib/utils'

function getExtensionFromMimeType(mimeType: string): string {
	const mimeMap: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/jpg': 'jpg',
		'image/png': 'png',
		'image/gif': 'gif',
		'image/webp': 'webp',
	}
	return mimeMap[mimeType] || 'bin'
}

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
	return value as Record<string, unknown>
}

function toUuidStringOrNull(value: unknown): string | null {
	if (typeof value !== 'string') return null
	const normalized = value.trim()
	if (!normalized) return null
	return isUuid(normalized) ? normalized : null
}

export abstract class WhatsAppService {
	static async getChannels(accountId: string, search?: string) {
		const targetAppId = await resolveAppId(accountId)

		return prisma.whatsapp_channels.findMany({
			where: {
				app_id: targetAppId || undefined,
				deleted_at: null,
				...(search
					? {
							OR: [
								{ name: { contains: search, mode: 'insensitive' } },
								{ phone_number: { contains: search, mode: 'insensitive' } },
							],
						}
					: {}),
			},
			orderBy: { created_at: 'desc' },
		})
	}

	static async getChannelById(id: string) {
		if (!isUuid(id)) return null

		return prisma.whatsapp_channels.findUnique({
			where: { id },
		})
	}

	static async createChannel(data: any, appId: string) {
		const targetAppId = await resolveAppId(appId)

		return prisma.$transaction(async (tx) => {
			let inboxId = data.inbox_id

			if (!inboxId) {
				const inbox = await tx.inboxes.create({
					data: {
						app_id: targetAppId,
						name: `WA: ${data.name || data.phone_number}`,
						channel_type: 'whatsapp',
						channel_config: { phoneNumberId: data.phone_number_id },
					},
				})
				inboxId = inbox.id
			}

			return tx.whatsapp_channels.create({
				data: {
					name: data.name,
					phone_number: data.phone_number,
					phone_number_id: data.phone_number_id,
					waba_id: data.waba_id,
					business_name: data.business_name,
					inbox_id: inboxId,
					app_id: targetAppId,
					provider: data.provider || 'whatsapp_cloud',
					api_key: data.api_key,
				},
			})
		})
	}

	static async updateChannel(id: string, data: any) {
		if (!isUuid(id)) return null

		const existingChannel = await prisma.whatsapp_channels.findUnique({
			where: { id },
			select: {
				id: true,
				inbox_id: true,
				extended_metadata: true,
			},
		})
		if (!existingChannel) return null

		const hasKey = (key: string) =>
			Object.prototype.hasOwnProperty.call(data || {}, key)

		const existingMetadata = asRecord(existingChannel.extended_metadata)
		const metadataUpdate: Record<string, unknown> = { ...existingMetadata }

		if (hasKey('tags')) {
			metadataUpdate.tags = Array.isArray(data.tags)
				? data.tags
						.map((item: unknown) => String(item || '').trim())
						.filter((item: string) => item.length > 0)
				: []
		}
		if (hasKey('default_chatbot_id')) {
			metadataUpdate.default_chatbot_id = toUuidStringOrNull(data.default_chatbot_id)
		}
		if (hasKey('default_flow_id')) {
			metadataUpdate.default_flow_id = toUuidStringOrNull(data.default_flow_id)
		}
		if (hasKey('default_team_ids')) {
			metadataUpdate.default_team_ids = Array.isArray(data.default_team_ids)
				? data.default_team_ids
						.map((item: unknown) => toUuidStringOrNull(item))
						.filter((item: string | null): item is string => Boolean(item))
				: []
		}
		if (hasKey('default_agent_ids')) {
			metadataUpdate.default_agent_ids = Array.isArray(data.default_agent_ids)
				? data.default_agent_ids
						.map((item: unknown) => toUuidStringOrNull(item))
						.filter((item: string | null): item is string => Boolean(item))
				: []
		}
		if (hasKey('distribution_method')) {
			metadataUpdate.distribution_method =
				typeof data.distribution_method === 'string'
					? data.distribution_method
					: null
		}

		return prisma.$transaction(async (tx) => {
			const updatedChannel = await tx.whatsapp_channels.update({
				where: { id },
				data: {
					name: data.name,
					phone_number: data.phone_number,
					is_active: data.is_active,
					business_name: data.business_name,
					extended_metadata: metadataUpdate as any,
					updated_at: new Date(),
				},
			})

			if (existingChannel.inbox_id && isUuid(existingChannel.inbox_id)) {
				const inbox = await tx.inboxes.findUnique({
					where: { id: existingChannel.inbox_id },
					select: { channel_config: true },
				})
				const channelConfigUpdate: Record<string, unknown> = {}
				if (hasKey('default_chatbot_id')) {
					channelConfigUpdate.default_chatbot_id = metadataUpdate.default_chatbot_id
				}
				if (hasKey('default_flow_id')) {
					channelConfigUpdate.default_flow_id = metadataUpdate.default_flow_id
				}
				if (hasKey('default_team_ids')) {
					channelConfigUpdate.default_team_ids = metadataUpdate.default_team_ids || []
				}
				if (hasKey('default_agent_ids')) {
					channelConfigUpdate.default_agent_ids = metadataUpdate.default_agent_ids || []
				}
				if (hasKey('distribution_method')) {
					channelConfigUpdate.distribution_method =
						metadataUpdate.distribution_method
				}

				const inboxData: Record<string, unknown> = {
					updated_at: new Date(),
				}
				if (hasKey('default_chatbot_id')) {
					inboxData.chatbot_id =
						(metadataUpdate.default_chatbot_id as string | null) || null
				}
				if (Object.keys(channelConfigUpdate).length > 0) {
					inboxData.channel_config = {
						...asRecord(inbox?.channel_config),
						...channelConfigUpdate,
					}
				}

				await tx.inboxes.update({
					where: { id: existingChannel.inbox_id },
					data: inboxData,
				})
			}

			return updatedChannel
		})
	}

	/**
	 * Upload channel badge image to S3/R2
	 */
	static async uploadBadge(channelId: string, file: File) {
		if (!isUuid(channelId)) throw new Error('Invalid channel ID')

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
		if (!allowedTypes.includes(file.type)) {
			throw new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed')
		}

		// Validate file size (max 2MB)
		const maxSize = 2 * 1024 * 1024
		if (file.size > maxSize) {
			throw new Error('File size exceeds 2MB limit')
		}

		// Get channel info
		const channel = await prisma.whatsapp_channels.findUnique({
			where: { id: channelId },
			select: { phone_number_id: true },
		})

		if (!channel) throw new Error('Channel not found')

		const phoneNumberId = channel.phone_number_id || 'unknown'

		const s3ConfigError = getS3UploadConfigurationError()
		if (s3ConfigError) {
			throw new Error(s3ConfigError)
		}

		// Upload to S3/R2
		const extension = getExtensionFromMimeType(file.type)
		const hash = crypto.randomBytes(8).toString('hex')
		const key = `whatsapp/badges/${phoneNumberId}_${hash}.${extension}`

		const buffer = Buffer.from(await file.arrayBuffer())

		await s3.send(
			new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key,
				Body: buffer,
				ContentType: file.type,
				Metadata: {
					channelId,
					phoneNumberId,
					uploadedAt: new Date().toISOString(),
				},
			}),
		)

		const publicUrl = buildS3PublicUrl(key)
		if (!publicUrl) {
			throw new Error('S3 public URL is not configured')
		}

		// Update database
		await prisma.whatsapp_channels.update({
			where: { id: channelId },
			data: {
				badge_url: publicUrl,
				updated_at: new Date(),
			},
		})

		console.log('[Badge Upload] ✅ Badge uploaded:', publicUrl)

		return { badge_url: publicUrl }
	}

	/**
	 * Remove channel badge (reset to default profile picture)
	 */
	static async removeBadge(channelId: string) {
		if (!isUuid(channelId)) throw new Error('Invalid channel ID')

		const channel = await prisma.whatsapp_channels.findUnique({
			where: { id: channelId },
			select: { extended_metadata: true, profile_picture_url: true },
		})

		if (!channel) throw new Error('Channel not found')

		// Fallback to profile_picture_url or extended_metadata.profile_picture_url
		const metadata = (channel.extended_metadata as any) || {}
		const defaultBadge = channel.profile_picture_url || metadata.profile_picture_url || null

		await prisma.whatsapp_channels.update({
			where: { id: channelId },
			data: {
				badge_url: defaultBadge,
				updated_at: new Date(),
			},
		})

		console.log('[Badge Remove] ✓ Badge reset to default')

		return {
			badge_url: defaultBadge,
			message: defaultBadge ? 'Badge reset to profile picture' : 'Badge removed',
		}
	}

	static async deleteChannel(id: string) {
		if (!isUuid(id)) return null

		const channel = await prisma.whatsapp_channels.findUnique({
			where: { id },
			select: { inbox_id: true },
		})

		if (!channel) throw new Error('Channel not found')

		const result = await prisma.$transaction(async (tx) => {
			await tx.whatsapp_channels.update({
				where: { id },
				data: {
					deleted_at: new Date(),
					is_active: false,
				},
			})

			if (channel.inbox_id) {
				await tx.inboxes.update({
					where: { id: channel.inbox_id },
					data: { deleted_at: new Date() },
				})
			}
			return true
		})
		return result
	}

	/**
	 * Complete WABA Sync and Channel Creation
	 * Handles the complex logic of discovering WABAs, Phones, and creating channels.
	 */
	static async completeWabaSync(
		accessToken: string,
		appId: string,
		seeds: { wabaIds: string[]; phoneIds: string[] },
	) {
		console.log('[WhatsAppService] Starting WABA Sync...', { seeds })
		const targetAppId = await resolveAppId(appId)
		console.log('[WhatsAppService] targetAppId resolved:', targetAppId)

		let activeToken = accessToken
		// Exchange short-lived token for long-lived user access token
		console.log('[WhatsAppService] Exchanging for long-lived token...')
		try {
			const longLivedResponse = await fetch(
				`https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FB_APP_ID}&client_secret=${process.env.FB_APP_SECRET}&fb_exchange_token=${activeToken}`
			)
			const longLivedData = (await longLivedResponse.json()) as any
			if (longLivedData.access_token) {
				console.log('[WhatsAppService] Successfully acquired long-lived token.')
				activeToken = longLivedData.access_token
			} else {
				console.log('[WhatsAppService] Failed to get long-lived token:', longLivedData.error)
			}
		} catch (e) {
			console.error('[WhatsAppService] Error exchanging token:', e)
		}

		// 1. Get debug token info to verify scopes and granular IDs
		const appAccessToken = `${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`
		console.log('[WhatsAppService] Calling debug_token...')
		const debugResponse = await fetch(
			`https://graph.facebook.com/v23.0/debug_token?input_token=${activeToken}&access_token=${appAccessToken}`,
		)
		const debugData = (await debugResponse.json()) as any
		console.log('[WhatsAppService] debug_token result:', JSON.stringify(debugData, null, 2))

		const discoveredWabaIds = new Set<string>(seeds.wabaIds)
		const potentialPhoneIds = new Set<string>(seeds.phoneIds)

		// Add from granular scopes
		const granularScopes = debugData.data?.granular_scopes || []
		for (const scope of granularScopes) {
			if (scope.scope === 'whatsapp_business_management') {
				scope.target_ids?.forEach((id: string) => discoveredWabaIds.add(id))
			}
			if (scope.scope === 'whatsapp_business_messaging') {
				scope.target_ids?.forEach((id: string) => potentialPhoneIds.add(id))
			}
		}

		if (debugData.data?.shared_waba_id) {
			discoveredWabaIds.add(debugData.data.shared_waba_id)
		}

		// Deep Discovery if no WABAs found
		if (discoveredWabaIds.size === 0) {
			console.log('[WhatsAppService] Deep Discovery: Fetching user WABAs...')
			try {
				const meResponse = await fetch(
					`https://graph.facebook.com/v23.0/me?fields=id,name,businesses{id,name,whatsapp_business_accounts{id,name}}&access_token=${activeToken}`,
				)
				const meData = (await meResponse.json()) as any

				// Check businesses
				if (meData.businesses?.data) {
					meData.businesses.data.forEach((biz: any) => {
						biz.whatsapp_business_accounts?.data?.forEach((waba: any) =>
							discoveredWabaIds.add(waba.id),
						)
					})
				}

				// Check direct WABAs
				if (discoveredWabaIds.size === 0) {
					const wabasResponse = await fetch(
						`https://graph.facebook.com/v23.0/me/whatsapp_business_accounts?access_token=${activeToken}`,
					)
					const wabasData = (await wabasResponse.json()) as any
					wabasData.data?.forEach((waba: any) => discoveredWabaIds.add(waba.id))
				}
			} catch (e) {
				console.error('[WhatsAppService] Deep Discovery failed', e)
			}
		}

		console.log(
			'[WhatsAppService] Discovered WABAs:',
			Array.from(discoveredWabaIds),
		)
		console.log(
			'[WhatsAppService] Potential Phone IDs:',
			Array.from(potentialPhoneIds),
		)

		const finalPhoneIds = new Set<string>()
		const phoneToWabaMap = new Map<string, string>()
		const firstWabaId = Array.from(discoveredWabaIds)[0]

		// Fetch phones for each WABA
		for (const wabaId of discoveredWabaIds) {
			try {
				let phonesResponse = await fetch(
					`https://graph.facebook.com/v23.0/${wabaId}/phone_numbers?access_token=${activeToken}`,
				)
				let phonesData = (await phonesResponse.json()) as any
				
				// Fallback to systemic token if user token lacks permissions
				if (phonesData.error && process.env.WHATSAPP_ACCESS_TOKEN) {
					console.log(`[WhatsAppService] User token failed to fetch phones. Retrying with system token...`)
					phonesResponse = await fetch(
						`https://graph.facebook.com/v23.0/${wabaId}/phone_numbers?access_token=${process.env.WHATSAPP_ACCESS_TOKEN}`,
					)
					phonesData = (await phonesResponse.json()) as any
				}

				if (phonesData.data) {
					console.log(`[WhatsAppService] WABA ${wabaId} has ${phonesData.data.length} phones:`, phonesData.data.map((p: any) => p.id))
					phonesData.data.forEach((p: any) => {
						finalPhoneIds.add(p.id)
						phoneToWabaMap.set(p.id, wabaId)
					})
				} else {
					console.log(`[WhatsAppService] WABA ${wabaId} phones response:`, JSON.stringify(phonesData))
				}
			} catch (e) {
				console.error(
					`[WhatsAppService] Failed to fetch phones for WABA ${wabaId}`,
					e,
				)
			}
		}

	// Removed orphaned phone IDs feature since potentialPhoneIds contains WABA IDs, not Phone IDs

		// Subscribe WABAs to webhook
		for (const wabaId of discoveredWabaIds) {
			try {
				console.log(`[WhatsAppService] Subscribing WABA ${wabaId} to webhook...`)
				const subResponse = await fetch(
					`https://graph.facebook.com/v23.0/${wabaId}/subscribed_apps?access_token=${activeToken}`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
					}
				)
				const subData = await subResponse.json()
				console.log(`[WhatsAppService] Subscribed WABA ${wabaId}:`, JSON.stringify(subData))
			} catch (e) {
				console.error(`[WhatsAppService] Failed to subscribe WABA ${wabaId}`, e)
			}
		}

		const createdChannels = []
		const apiErrors: any[] = []

		// Process each phone number
		for (const phoneId of finalPhoneIds) {
			try {
				const wabaId = phoneToWabaMap.get(phoneId) || firstWabaId
				if (!wabaId) continue

				// Fetch details
				let tokenForFetch = activeToken;
				let [wabaData, phoneData] = await Promise.all([
					fetch(
						`https://graph.facebook.com/v23.0/${wabaId}?fields=id,name,currency&access_token=${tokenForFetch}`,
					).then((r) => r.json() as Promise<any>),
					fetch(
						`https://graph.facebook.com/v23.0/${phoneId}?fields=id,display_phone_number,verified_name,quality_rating,messaging_limit_tier&access_token=${tokenForFetch}`,
					).then((r) => r.json() as Promise<any>),
				])

				if ((wabaData.error || phoneData.error) && process.env.WHATSAPP_ACCESS_TOKEN) {
					console.log(`[WhatsAppService] Details fetch failed with user token. Retrying with system token...`)
					tokenForFetch = process.env.WHATSAPP_ACCESS_TOKEN;
					const fallbackResults = await Promise.all([
						fetch(
							`https://graph.facebook.com/v23.0/${wabaId}?fields=id,name,currency&access_token=${tokenForFetch}`,
						).then((r) => r.json() as Promise<any>),
						fetch(
							`https://graph.facebook.com/v23.0/${phoneId}?fields=id,display_phone_number,verified_name,quality_rating,messaging_limit_tier&access_token=${tokenForFetch}`,
						).then((r) => r.json() as Promise<any>),
					]);
					wabaData = fallbackResults[0];
					phoneData = fallbackResults[1];
				}

				if (wabaData.error || phoneData.error) {
					console.error(
						'[WhatsAppService] Error fetching details for',
						phoneId,
						wabaData.error || phoneData.error,
					)
					apiErrors.push({ phoneId, wabaError: wabaData.error?.message, phoneError: phoneData.error?.message })
					continue
				}

				// Create Channel using internal method (mimicking createChannel but with full data)
				const channelName =
					phoneData.verified_name ||
					phoneData.display_phone_number ||
					'WhatsApp Channel'

				// Reuse createChannel logic or direct prisma call
				// We'll use a direct Prisma transaction here to handle upsert properly
				const savedChannel = await prisma.$transaction(async (tx) => {
					// Upsert Inbox
					let inbox = await tx.inboxes.findFirst({
						where: {
							channel_type: 'whatsapp',
							// Prisma JSON filter
							channel_config: { path: ['phoneNumberId'], equals: phoneId },
						},
					})

					if (!inbox) {
						inbox = await tx.inboxes.create({
							data: {
								app_id: targetAppId,
								name: `WA: ${channelName}`,
								channel_type: 'whatsapp',
								channel_config: { phoneNumberId: phoneId },
							},
						})
					} else {
						await tx.inboxes.update({
							where: { id: inbox.id },
							data: { name: `WA: ${channelName}`, deleted_at: null },
						})
					}

					// Upsert Channel
					const existingChannel = await tx.whatsapp_channels.findFirst({
						where: { phone_number_id: phoneId },
					})

					if (existingChannel) {
						return tx.whatsapp_channels.update({
							where: { id: existingChannel.id },
							data: {
								name: channelName,
								phone_number: phoneData.display_phone_number,
								waba_id: wabaId,
								api_key: activeToken,
								business_name: wabaData.name,
								extended_metadata: {
									quality_rating: phoneData.quality_rating,
									messaging_limit: phoneData.messaging_limit_tier,
								},
								is_active: true,
								deleted_at: null,
								inbox_id: inbox.id,
							},
						})
					} else {
						return tx.whatsapp_channels.create({
							data: {
								app_id: targetAppId,
								name: channelName,
								phone_number: phoneData.display_phone_number,
								phone_number_id: phoneId,
								waba_id: wabaId,
								api_key: activeToken,
								business_name: wabaData.name,
								provider: 'whatsapp_cloud',
								extended_metadata: {
									quality_rating: phoneData.quality_rating,
									messaging_limit: phoneData.messaging_limit_tier,
								},
								inbox_id: inbox.id,
							},
						})
					}
				})

				createdChannels.push(savedChannel)
			} catch (error: any) {
				console.error(
					'[WhatsAppService] Failed to process phoneId',
					phoneId,
					error,
				)
				apiErrors.push({ phoneId, error: error.message || String(error) })
			}
		}

		if (createdChannels.length === 0) {
			let errorReason = 'Unknown configuration error while syncing WABA';
			if (discoveredWabaIds.size === 0) {
				errorReason = 'No WhatsApp Business Accounts found inside the provided Meta Account. If you just created one, please make sure it was successfully added.';
			} else if (finalPhoneIds.size === 0) {
				errorReason = 'WhatsApp Business Account was found, but no phone numbers are linked to it. Please add a valid phone number in the Meta Business Manager and try again.';
			} else {
				errorReason = 'Phone numbers were found but could not be processed due to Graph API permission errors. Is the WhatsApp account active? API Details: ' + JSON.stringify(apiErrors);
			}
			throw new Error(errorReason);
		}

		return createdChannels
	}
}
