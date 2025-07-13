import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { PostHogProvider } from 'posthog-js/react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from './providers/theme-provider.tsx';
import { RouterProvider } from 'react-router';
import router from './router.tsx';
import { POSTHOG_HOST, POSTHOG_KEY } from './constants/index.ts';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<PostHogProvider
			apiKey={POSTHOG_KEY}
			options={{
				api_host: POSTHOG_HOST,
				defaults: '2025-05-24'
			}}
		>
			<ThemeProvider>
				<RouterProvider router={router} />
			</ThemeProvider>
			<Toaster />
		</PostHogProvider>
	</StrictMode>
);
