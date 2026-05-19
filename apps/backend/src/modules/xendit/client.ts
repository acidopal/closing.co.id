import Xendit from 'xendit-node'

const x = new Xendit({
	secretKey: process.env.XENDIT_SECRET_KEY || '',
})

export const xendit = x
