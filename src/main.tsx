import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { PostHogProvider } from 'posthog-js/react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from './providers/theme-provider.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<PostHogProvider
			apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
			options={{
				api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
				defaults: '2025-05-24'
			}}
		>
			<ThemeProvider>
				<App />
			</ThemeProvider>
			<Toaster />
		</PostHogProvider>
	</StrictMode>
);
