import { TrainTrackIcon } from 'lucide-react';
// import logoAdif from '../assets/logo-adif.webp';
import ThemeSelect from './theme-select';

export default function Navbar() {
	return (
		<nav className="flex items-center p-4 bg-sidebar border-b border-foreground/10 sticky top-0 z-1 gap-4">
			{/* <div
				className="md:max-w-[150px] md:w-[150px] md:h-[40px] max-w-[75px] w-[75px] h-[40px]"
				style={{
					backgroundColor: 'var(--sidebar-foreground)',
					WebkitMask: `url(${logoAdif}) center/contain no-repeat`,
					mask: `url(${logoAdif}) center/contain no-repeat`
				}}
				aria-label="Logo"
			/> */}
			<TrainTrackIcon className="text-sidebar-foreground h-8 md:h-12 w-8 md:w-12" />
			<h1 className="md:text-4xl text-xl text-sidebar-foreground font-light relative">
				<span className="font-extrabold">Configurar</span> <span>Ferropanel</span>
				<small className="absolute italic text-sm -bottom-4 -right-6">A**f compliant</small>
			</h1>
			<div className="ml-auto">
				<ThemeSelect />
			</div>
		</nav>
	);
}
