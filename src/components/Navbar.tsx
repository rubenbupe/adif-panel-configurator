import logoAdif from '../assets/logo-adif.webp';
import ThemeSelect from './theme-select';

export default function Navbar() {
	return (
		<nav className="flex items-center p-4 bg-sidebar border-b border-foreground/10 sticky top-0 z-1 gap-4">
			<div
				className="md:max-w-[150px] md:w-[150px] md:h-[40px] max-w-[75px] w-[75px] h-[40px]"
				style={{
					backgroundColor: 'var(--sidebar-foreground)',
					WebkitMask: `url(${logoAdif}) center/contain no-repeat`,
					mask: `url(${logoAdif}) center/contain no-repeat`
				}}
				aria-label="ADIF Logo"
			/>
			<h1 className="md:text-4xl text-xl text-sidebar-foreground font-light">
				<span className="font-extrabold">Configurar</span> Panel
			</h1>
			<div className="ml-auto">
				<ThemeSelect />
			</div>
		</nav>
	);
}
