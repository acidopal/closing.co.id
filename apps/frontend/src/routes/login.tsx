import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
	consumePostLoginRedirect,
	organizationApi,
	persistOrganizationContext,
} from '@/lib/organization'

export const Route = createFileRoute('/login')({
	component: LoginPage,
})

const AUTH_BASE = import.meta.env.VITE_API_URL
	? `${import.meta.env.VITE_API_URL}/auth`
	: 'http://localhost:3010/auth'

function LoginPage() {
	const navigate = useNavigate()

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		try {
			const response = await fetch(`${AUTH_BASE}/sign-in/email`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ email, password }),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Login failed')
			}

			const data = await response.json()
			if (data?.token) {
				localStorage.setItem('scalechat_token', data.token)
			}

			localStorage.setItem('scalechat_user', JSON.stringify(data.user))

			try {
				const { organizations, activeOrganizationId } =
					await organizationApi.list()

				if (organizations.length === 0) {
					navigate({ to: '/create-org', replace: true })
				} else if (organizations.length === 1) {
					const org = organizations[0]
					await organizationApi.setActive(org.id)
					persistOrganizationContext(org)
					const redirectPath = consumePostLoginRedirect()
					navigate({ to: redirectPath, replace: true })
				} else {
					if (activeOrganizationId) {
						const activeOrg = organizations.find(
							(o) => o.id === activeOrganizationId,
						)
						if (activeOrg) {
							persistOrganizationContext(activeOrg)
							const redirectPath = consumePostLoginRedirect()
							navigate({ to: redirectPath, replace: true })
							return
						}
					}
					navigate({ to: '/select-org', replace: true })
				}
			} catch (orgErr) {
				console.warn('Org API failed, redirecting to dashboard:', orgErr)
				navigate({ to: '/dashboard', replace: true })
			}
		} catch (err: any) {
			setError(err.message || 'Login failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
			<div className="mx-auto w-full max-w-md space-y-8 px-4 py-12 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col items-center gap-2 text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand-blue text-white shadow-md">
							<span className="text-2xl font-bold">C</span>
						</div>
						<div>
							<h1 className="text-2xl font-bold text-gray-900">Closing AI</h1>
							<p className="text-sm text-gray-500">
								WhatsApp & Instagram Messaging Platform
							</p>
						</div>
					</div>

					<div className="space-y-6" data-auth-content="true">
						<div className="text-card-foreground rounded-xl bg-card/50 p-8 shadow-xl backdrop-blur-sm transition-all hover:shadow-2xl">
							<form onSubmit={handleLogin} className="flex flex-col gap-6">
								<FieldGroup>
									<div className="flex flex-col items-center gap-1 text-center">
										<h1 className="text-2xl font-bold">Welcome Back</h1>
										<p className="text-muted-foreground text-sm text-balance">
											Enter your email and password to continue
										</p>
									</div>

									<Field>
										<FieldLabel htmlFor="email">Email</FieldLabel>
										<Input
											id="email"
											type="email"
											placeholder="m@example.com"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											required
											className="bg-background"
										/>
									</Field>

									<Field>
										<div className="flex items-center justify-between">
											<FieldLabel htmlFor="password">Password</FieldLabel>
											<a
												href="/"
												className="text-muted-foreground text-sm font-medium hover:underline"
											>
												Forgot password?
											</a>
										</div>
										<Input
											id="password"
											type="password"
											placeholder="Password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											required
											className="bg-background"
										/>
									</Field>

									{error && (
										<Field>
											<Alert variant="destructive">
												<AlertDescription>{error}</AlertDescription>
											</Alert>
										</Field>
									)}

									<Field>
										<Button
											type="submit"
											disabled={loading}
											size="lg"
											className="w-full"
										>
											{loading ? 'Logging in...' : 'Login'}
										</Button>
									</Field>

									<Field>
										<FieldDescription className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-center text-brand-navy dark:text-brand-cloud">
											💡 Login issues? Try Ctrl+Shift+R (hard refresh) or clear
											browser cache/storage.
										</FieldDescription>
									</Field>
								</FieldGroup>
							</form>
						</div>
					</div>

					<div className="flex flex-col space-y-4 text-center">
						<p className="text-muted-foreground px-8 text-xs">
							By logging in, you agree to our{' '}
							<Link
								className="hover:text-primary transition-all underline underline-offset-4"
								to="/terms"
							>
								Terms of Service
							</Link>{' '}
							and{' '}
							<Link
								className="hover:text-primary transition-all underline underline-offset-4"
								to="/privacy"
							>
								Privacy Policy
							</Link>
						</p>
					</div>

					<div className="text-center text-xs text-gray-500">
						<p>
							Don't have an account?{' '}
							<Link
								to="/register"
								className="font-medium text-primary hover:underline"
							>
								Sign up
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
