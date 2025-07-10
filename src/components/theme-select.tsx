import { useSystemTheme, useTheme } from '@/providers/theme-provider';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuShortcut,
	DropdownMenuTrigger
} from './ui/dropdown-menu';
import { LaptopIcon, MoonIcon, SunIcon } from 'lucide-react';

export default function ThemeSelect() {
	const systemTheme = useSystemTheme();
	const { theme, calculatedTheme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="w-full rounded-full">
				<div className="p-1 rounded-full text-sidebar-foreground cursor-pointer">
					{calculatedTheme === 'light' ? <SunIcon size={24} /> : <MoonIcon size={24} />}
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[200px]" defaultValue={theme}>
				<DropdownMenuItem onClick={() => setTheme('system')} aria-selected={theme === 'system'}>
					Sistema ({systemTheme === 'light' ? 'Claro' : 'Oscuro'})
					<DropdownMenuShortcut>
						<LaptopIcon size={14} className="stroke-foreground" />
					</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme('light')} aria-selected={theme === 'light'}>
					Claro
					<DropdownMenuShortcut>
						<SunIcon size={14} className="stroke-foreground" />
					</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme('dark')} aria-selected={theme === 'dark'}>
					Oscuro
					<DropdownMenuShortcut>
						<MoonIcon size={14} className="stroke-foreground" />
					</DropdownMenuShortcut>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
