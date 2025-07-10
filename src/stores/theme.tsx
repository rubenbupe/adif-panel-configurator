import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ThemeData {
	theme: 'light' | 'dark' | 'system';
}

export interface ThemeStore extends ThemeData {
	clearData: () => void;
	setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeStore>()(
	persist(
		set => ({
			collapsedSidebar: false,
			theme: 'system',
			clearData: () => {
				set(() => ({
					theme: 'system'
				}));
			},
			setTheme: (theme: 'light' | 'dark' | 'system') => {
				set(() => ({
					theme
				}));
			}
		}),
		{
			name: 'theme',
			version: 1,
			storage: createJSONStorage(() => localStorage),
			migrate: async (persistedState: unknown) => {
				return persistedState;
			}
		}
	)
);
