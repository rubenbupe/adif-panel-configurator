
import { useThemeStore } from '@/stores/theme';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
	children: React.ReactNode;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	calculatedTheme: Omit<Theme, 'system'>;
};

const initialState: ThemeProviderState = {
	theme: 'system',
	setTheme: () => null,
	calculatedTheme: 'light'
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	const theme = useThemeStore(state => state.theme);
	const setTheme = useThemeStore(state => state.setTheme);
	const systemTheme = useSystemTheme();

	const calculatedTheme = theme === 'system' ? systemTheme : theme;

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove('light', 'dark');

		if (theme === 'system') {
			root.classList.add(systemTheme);
			return;
		}

		root.classList.add(theme);
	}, [theme, systemTheme, setTheme]);

	const value = {
		theme,
		setTheme,
		calculatedTheme
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useSystemTheme = () => {
	const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(
		window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
	);

	useEffect(() => {
		const listener = (e: MediaQueryListEvent) => {
			const systemTheme = e.matches ? 'dark' : 'light';
			setSystemTheme(systemTheme);
		};
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		media.addEventListener('change', listener);
		return () => {
			media.removeEventListener('change', listener);
		};
	}, []);

	return systemTheme;
};

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

	return context;
};
