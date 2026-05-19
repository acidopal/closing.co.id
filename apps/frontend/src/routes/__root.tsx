import { TanStackDevtools } from '@tanstack/react-devtools'
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { useEffect, useState } from 'react'
import { ThemeProvider } from '@/components/theme-provider'

import '../styles.css'

declare global {
	interface Window {
		fbAsyncInit?: () => void
		FB?: {
			init: (config: {
				appId: string
				autoLogAppEvents: boolean
				xfbml: boolean
				version: string
			}) => void
		}
	}
}

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: 'utf-8',
			},
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1',
			},
			{
				title: 'Closing AI - AI-Powered Agent Platform',
			},
			{
				name: 'description',
				content:
					'Closing AI - AI-powered customer engagement platform with Facebook integration',
			},
			{
				property: 'og:type',
				content: 'website',
			},
			{
				property: 'og:url',
				content: 'https://app.closing.co.id/',
			},
			{
				property: 'og:title',
				content: 'Closing AI - AI-Powered Agent Platform',
			},
			{
				property: 'og:description',
				content:
					'AI-powered customer engagement platform with Facebook integration',
			},
			{
				name: 'facebook-domain-verification',
				content: 'YOUR_VERIFICATION_CODE',
			},
		],
		links: [],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
})

function RootComponent() {
	return <Outlet />
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false)
	const shouldShowTanStackDevtools =
		mounted &&
		import.meta.env.DEV &&
		import.meta.env.VITE_SHOW_TANSTACK_DEVTOOLS === 'true'

	useEffect(() => {
		setMounted(true)

		window.fbAsyncInit = () => {
			window.FB?.init({
				appId: '4254442994883589',
				autoLogAppEvents: true,
				xfbml: true,
				version: 'v24.0',
			})
		}

		if (document.getElementById('facebook-jssdk')) return

		const script = document.createElement('script')
		script.id = 'facebook-jssdk'
		script.async = true
		script.src = 'https://connect.facebook.net/en_US/sdk.js'
		document.body.appendChild(script)

		return () => {
			window.fbAsyncInit = undefined
		}
	}, [])

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-background text-foreground antialiased">
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem={false}
					storageKey="scalebiz-theme"
				>
					<div id="fb-root"></div>
					{children}
					{shouldShowTanStackDevtools && (
						<TanStackDevtools
							config={{
								position: 'bottom-right',
							}}
							plugins={[
								{
									name: 'Tanstack Router',
									render: <TanStackRouterDevtoolsPanel />,
								},
							]}
						/>
					)}
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	)
}
