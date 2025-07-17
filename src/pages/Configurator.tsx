import { useMemo, useState } from 'react';
import { GithubIcon } from 'lucide-react';
import { PanelMode, Language, type HeaderOptionsState } from '../components/configurator/PanelHeader';
import { ListInterface, ServiceType } from '../components/configurator/ListOptions';
import type { ListOptionsState } from '../components/configurator/ListOptions';
import { PlatformMode } from '../components/configurator/PlatformOptions';
import type { PlatformOptionsState } from '../components/configurator/PlatformOptions';
import type { NumberOptionsState } from '../components/configurator/NumberOptions';
import ConfiguratorForm from '../components/configurator';
import Preview from '../components/configurator/Preview';
import Navbar from '../components/Navbar';
import { buildPanelUrlFromData, isDefaultInterfaz, modeToInterfaz } from '@/lib/props';

export default function Configurator() {
	const [headerOptions, setHeaderOptions] = useState<HeaderOptionsState>({
		stationCode: '17000',
		languages: [Language.ESP],
		mode: PanelMode.Departures
	});

	const [listOptions, setListOptions] = useState<ListOptionsState>({
		services: new Set([
			ServiceType.Cercanias,
			ServiceType.Regional,
			ServiceType.LargaDistancia,
			ServiceType.AltaVelocidad,
			ServiceType.ServicioInterno
		]),
		interfaz: ListInterface.Default,
		countdown: true,
		showAccess: false,
		showPlatform: true,
		showProduct: true,
		showNumber: true,
		showPlatformPreview: true,
		showHeader: true,
		productFilter: new Set(),
		companyFilter: new Set(),
		platformFilter: '',
		subtitle: null,
		subtitleParam: ''
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
		return buildPanelUrlFromData({
			headerOptions,
			listOptions,
			platformOptions,
			numberOptions,
			fontSize
		});
	}, [headerOptions, listOptions, platformOptions, numberOptions, fontSize]);

	const isExternal = useMemo(() => {
		return isDefaultInterfaz(modeToInterfaz(headerOptions.mode, listOptions.interfaz));
	}, [listOptions.interfaz, headerOptions.mode]);

	return (
		<div className="w-screen min-h-screen max-w-screen flex flex-col">
			<Navbar />
			<div className="w-full max-w-full flex-1 flex flex-col items-center justify-center bg-background gap-4 mt-4">
				<p className="max-w-2xl text-sidebar-foreground text-center text-balance bg-sidebar p-4 rounded-lg mx-4">
					Esta herramienta <strong>NO ES OFICIAL</strong> y <strong>NO ESTÁ AFILIADA</strong> a Adif de ninguna manera.
					Está diseñada para ayudar a los usuarios a consultar los paneles informativos de las estaciones de Adif.
				</p>
				<div className="grid lg:grid-cols-2 items-center gap-4 w-full p-4 max-w-7xl">
					<ConfiguratorForm
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
					<Preview url={url} isExternal={isExternal} />
				</div>
				<p className="max-w-2xl text-xs text-foreground/60 text-center">
					Este proyecto no está afiliado a Adif y tiene proposito educacional. Algunas configuraciones pueden no
					funcionar como se espera.
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
