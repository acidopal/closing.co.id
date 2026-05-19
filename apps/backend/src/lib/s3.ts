import { S3Client } from '@aws-sdk/client-s3'

const derivedR2Endpoint = process.env.R2_ACCOUNT_ID
	? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
	: ''
const endpoint =
	process.env.S3_ENDPOINT || process.env.R2_ENDPOINT || derivedR2Endpoint || ''
const hasCustomEndpoint = Boolean(endpoint)
const staticAccessKeyId =
	process.env.S3_ACCESS_KEY ||
	process.env.AWS_ACCESS_KEY_ID ||
	process.env.R2_ACCESS_KEY_ID ||
	''
const staticSecretAccessKey =
	process.env.S3_SECRET_KEY ||
	process.env.AWS_SECRET_ACCESS_KEY ||
	process.env.R2_SECRET_ACCESS_KEY ||
	''
const hasStaticCredentials = Boolean(staticAccessKeyId && staticSecretAccessKey)
const s3PublicBase =
	(
		process.env.S3_PUBLIC_URL ||
		process.env.R2_PUBLIC_URL ||
		process.env.S3_ENDPOINT ||
		process.env.R2_ENDPOINT ||
		''
	).replace(/\/$/, '')

const s3Config: ConstructorParameters<typeof S3Client>[0] = {
	endpoint: endpoint || undefined,
	region:
		process.env.S3_REGION ||
		process.env.R2_REGION ||
		process.env.AWS_REGION ||
		process.env.AWS_DEFAULT_REGION ||
		(hasCustomEndpoint ? 'auto' : 'us-east-1'),
	forcePathStyle: hasCustomEndpoint,
}

if (hasStaticCredentials) {
	s3Config.credentials = {
		accessKeyId: staticAccessKeyId,
		secretAccessKey: staticSecretAccessKey,
	}
}

export const s3 = new S3Client(s3Config)

export const BUCKET_NAME =
	process.env.S3_BUCKET || process.env.R2_BUCKET_NAME || 'scalebiz-media'

export function buildS3PublicUrl(key: string): string | null {
	if (!s3PublicBase) return null
	return `${s3PublicBase}/${BUCKET_NAME}/${key}`
}

export function isS3UploadConfigured(): boolean {
	return Boolean(s3PublicBase)
}

export function getS3UploadConfigurationError(): string | null {
	if (!s3PublicBase) {
		return 'S3 public URL is not configured'
	}

	if (hasCustomEndpoint && !hasStaticCredentials) {
		return 'S3 credentials are not configured'
	}

	return null
}

export default s3
