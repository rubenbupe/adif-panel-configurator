import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Label } from './components/ui/label';
import { Slider } from './components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { CopyIcon, ExternalLinkIcon, GithubIcon } from 'lucide-react';
import logoAdif from './assets/logo-adif.webp';
import { buildUrl } from './lib/url';
import { Field } from './components/field';
import { PanelHeader, PanelMode, Language, type HeaderOptionsState } from './components/panel/PanelHeader';
import { ListOptions, Direction, ServiceType } from './components/panel/ListOptions';
import type { ListOptionsState } from './components/panel/ListOptions';
import { PlatformOptions, PlatformMode } from './components/panel/PlatformOptions';
import type { PlatformOptionsState } from './components/panel/PlatformOptions';
import { NumberOptions } from './components/panel/NumberOptions';
import type { NumberOptionsState } from './components/panel/NumberOptions';

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
		<div className="w-screen min-h-screen flex flex-col items-center justify-center bg-background gap-4">
			<img src={logoAdif} alt="ADIF Logo" className="max-w-[200px]" />
			<Card className="w-full max-w-2xl">
				<CardHeader>
					<CardTitle>Configurador de Paneles de ADIF</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<PanelHeader value={headerOptions} onChange={setHeaderOptions} />
					<Label className="text-sm font-medium">Tipo de panel</Label>
					<Tabs
						value={headerOptions.mode}
						onValueChange={value => setHeaderOptions(h => ({ ...h, mode: value as PanelMode }))}
					>
						<TabsList>
							<TabsTrigger value={PanelMode.List}>Listado de trenes</TabsTrigger>
							<TabsTrigger value={PanelMode.Platform}>Plataforma</TabsTrigger>
							<TabsTrigger value={PanelMode.Clock}>Reloj</TabsTrigger>
							{/* <TabsTrigger value={PanelMode.BlackClock}>Reloj oscuro</TabsTrigger> */}
							<TabsTrigger value={PanelMode.Number}>Número</TabsTrigger>
							{/* <TabsTrigger value={PanelMode.BlackNumber}>Número oscuro</TabsTrigger> */}
						</TabsList>
						<TabsContent value="list">
							<Card>
								<CardContent className="grid md:grid-cols-2 gap-4 py-0">
									<ListOptions value={listOptions} onChange={setListOptions} />
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="platform">
							<Card>
								<CardContent className="grid md:grid-cols-2 gap-4">
									<PlatformOptions value={platformOptions} onChange={setPlatformOptions} />
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="number">
							<Card>
								<CardContent className="grid md:grid-cols-2 gap-4">
									<NumberOptions value={numberOptions} onChange={setNumberOptions} />
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="black-number">
							<Card>
								<CardContent className="grid md:grid-cols-2 gap-4">
									<NumberOptions value={numberOptions} onChange={setNumberOptions} />
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
					<Field>
						<Label className="text-sm font-medium">Tamaño del texto</Label>
						<div className="flex flex-row items-center">
							<Slider
								value={[fontSize]}
								onValueChange={value => setFontSize(value[0])}
								min={1}
								max={4}
								step={1}
								className="w-full"
							/>
							<span className="ml-4 text-sm font-mono">x{fontSize}</span>
						</div>
					</Field>
					<Field>
						<Label className="text-sm font-medium">URL</Label>
						<Card className="p-4 flex flex-row items-center border-dashed">
							<span className="break-all font-mono text-sm">{url}</span>
							<CopyIcon
								className="ml-2 min-h-5 min-w-5 cursor-pointer"
								onClick={() => navigator.clipboard.writeText(url)}
							/>
						</Card>
					</Field>
					<Button
						variant="default"
						className="mt-4 w-full"
						size="lg"
						leftSection={<ExternalLinkIcon className="h-4 w-4" />}
						onClick={() => {
							window.open(url, '_blank');
						}}
					>
						Ir al Panel
					</Button>
				</CardContent>
			</Card>
			<p className="max-w-2xl text-xs text-foreground/60 text-center">
				Este proyecto no está afiliado a ADIF. Algunas configuraciones pueden no funcionar como se espera.
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
	);
}

export default App;
