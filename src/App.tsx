import { useMemo, useState } from 'react';
import { GithubIcon } from 'lucide-react';
import { buildUrl } from './lib/url';
import { PanelMode, Language, type HeaderOptionsState } from './components/panel/PanelHeader';
import { Direction, ServiceType } from './components/panel/ListOptions';
import type { ListOptionsState } from './components/panel/ListOptions';
import { PlatformMode } from './components/panel/PlatformOptions';
import type { PlatformOptionsState } from './components/panel/PlatformOptions';
import type { NumberOptionsState } from './components/panel/NumberOptions';
import Panel from './components/panel';
import Preview from './components/panel/Preview';
import Navbar from './components/Navbar';

function App() {
	const [headerOptions, setHeaderOptions] = useState<HeaderOptionsState>({
		stationCode: '17000',
		languages: [Language.ESP],
		mode: PanelMode.List
	});

	const [listOptions, setListOptions] = useState<ListOptionsState>({
		direction: Direction.Departures,
		services: new Set([ServiceType.Cercanias]),
		countdown: false,
		showAccess: false,
		showPlatform: true,
		showProduct: true,
		showNumber: true,
		showPlatformPreview: true,
		showHeader: true
	});

	const [platformOptions, setPlatformOptions] = useState<PlatformOptionsState>({
		platformLocation: '1,2,3,4,5,6,7,8,9',
		platformMode: PlatformMode.Platform
	});

	const [numberOptions, setNumberOptions] = useState<NumberOptionsState>({
		platformLocation: '1,2,3,4,5,6,7,8,9',
		numberIfNoTrains: '1'
	});

	const [fontSize, setFontSize] = useState(1);

	const url = useMemo(() => {
		return buildUrl({
			headerOptions,
			listOptions,
			platformOptions,
			numberOptions,
			fontSize
		});
	}, [headerOptions, listOptions, platformOptions, numberOptions, fontSize]);

	return (
		<div className="w-screen min-h-screen flex flex-col">
			<Navbar />
			<div className="w-full flex-1 flex flex-col items-center justify-center bg-background gap-4">
				<div className="grid md:grid-cols-2 gap-4 w-full p-4 max-w-7xl">
					<Panel
						headerOptions={headerOptions}
						setHeaderOptions={setHeaderOptions}
						listOptions={listOptions}
						setListOptions={setListOptions}
						platformOptions={platformOptions}
						setPlatformOptions={setPlatformOptions}
						numberOptions={numberOptions}
						setNumberOptions={setNumberOptions}
						fontSize={fontSize}
						setFontSize={setFontSize}
					/>
					<Preview url={url} />
				</div>
				<p className="max-w-2xl text-xs text-foreground/60 text-center">
					Este proyecto no está afiliado a Adif. Algunas configuraciones pueden no funcionar como se espera.
				</p>
				<div className="flex items-center justify-center">
					<GithubIcon className="h-3.5 w-3.5 inline-block mr-1 stroke-foreground/60" />
					<a
						href="https://github.com/rubenbupe/adif-panel-configurator"
						target="_blank"
						className="max-w-2xl text-xs text-foreground/60 text-center underline"
					>
						Ver en Github
					</a>
				</div>
			</div>
		</div>
	);
}

export default App;
