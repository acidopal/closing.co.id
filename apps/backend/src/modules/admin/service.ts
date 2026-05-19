import {
	incomingMessageQueue,
	outboundMessageQueue,
	aiProcessingQueue,
	webhookQueue,
} from '../../lib/queue'

export abstract class AdminService {
	static async getQueueStats() {
		const queues = [
			{ name: 'incoming', q: incomingMessageQueue },
			{ name: 'outbound', q: outboundMessageQueue },
			{ name: 'ai', q: aiProcessingQueue },
			{ name: 'webhook', q: webhookQueue },
		]

		const stats = await Promise.all(
			queues.map(async ({ name, q }) => {
				const [active, waiting, completed, failed, paused] = await Promise.all([
					q.getActiveCount(),
					q.getWaitingCount(),
					q.getCompletedCount(),
					q.getFailedCount(),
					q.isPaused(),
				])

				return {
					name,
					active,
					waiting,
					completed,
					failed,
					paused,
				}
			}),
		)

		return stats
	}

	static async retryFailed(queueName: string) {
		const queueMap: Record<string, any> = {
			incoming: incomingMessageQueue,
			outbound: outboundMessageQueue,
			ai: aiProcessingQueue,
			webhook: webhookQueue,
		}

		const queue = queueMap[queueName]
		if (!queue) throw new Error('Queue not found')

		const failed = await queue.getFailed()
		await Promise.all(failed.map((job: any) => job.retry()))

		return { success: true, count: failed.length }
	}
}
