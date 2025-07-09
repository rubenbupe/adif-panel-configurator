import { useMemo, useState } from 'react';
import { Field } from './components/field';
import { StationsCombobox } from './components/stations-combobox';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Label } from './components/ui/label';
import { MultiSelect } from './components/ui/multi-select';
import { CopyIcon, ExternalLinkIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group';
import { Checkbox } from './components/ui/checkbox';
import { Slider } from './components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Input } from './components/ui/input';
import { buildUrl } from './lib/url';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import logoAdif from './assets/logo-adif.webp';

function App() {
	const [stationCode, setStationCode] = useState('17000');
	const [languages, setLanguages] = useState<string[]>(['ESP']);
	const [mode, setMode] = useState<'list' | 'platform' | 'clock' | 'black-clock' | 'number' | 'black-number'>('list');

	// LIST
	const [direction, setDirection] = useState<'salidas' | 'llegadas'>('salidas');
	const [services, setServices] = useState<Set<'cercanias' | 'media-distancia' | 'larga-distancia'>>(
		new Set(['cercanias'])
	);
	const [countdown, setCountdown] = useState(false); // countdown-traffics customizes for which services the countdown is enabled
	const [showAccess, setShowAccess] = useState(false);
	const [showPlatform, setShowPlatform] = useState(true);
	const [showProduct, setShowProduct] = useState(true);
	const [showNumber, setShowNumber] = useState(true);
	const [showPlatformPreview, setShowPlatformPreview] = useState(true);
	const [showHeader, setShowHeader] = useState(true);
	// const [startTrain, setStartTrain] = useState('1'); // Tren fijado como primero

	// PLATFORM
	const [platformLocation, setPlatformLocation] = useState('1,2,3,4,5,6,7,8,9');
	const [numberIfNoTrains, setNumberIfNoTrains] = useState('1');
	const [platformMode, setPlatformMode] = useState<'access' | 'check-in' | 'platform'>('platform');

	const [fontSize, setFontSize] = useState(1);

	const url = useMemo(() => {
		return buildUrl({
			stationCode,
			languages,
			mode,

			direction,
			services,
			countdown,
			showAccess,
			showPlatform,
			showProduct,
			showNumber,
			showPlatformPreview,
			showHeader,

			platformLocation,
			numberIfNoTrains,
			platformMode,

			fontSize
		});
	}, [
		stationCode,
		languages,
		mode,

		direction,
		services,
		countdown,
		showAccess,
		showPlatform,
		showProduct,
		showNumber,
		showPlatformPreview,
		showHeader,

		platformLocation,
		numberIfNoTrains,
		platformMode,

		fontSize
	]);

	return (
		<div className="w-screen min-h-screen flex flex-col items-center justify-center bg-background gap-8">
			<img src={logoAdif} alt="ADIF Logo" className="max-w-[200px]" />
			<Card className="w-full max-w-2xl">
				<CardHeader>
					<CardTitle>Configurar Panel de ADIF</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Field>
						<Label className="text-sm font-medium">Estación</Label>
						<StationsCombobox onChange={setStationCode} value={stationCode} />
					</Field>
					<Field>
						<Label className="text-sm font-medium">Idiomas</Label>
						<MultiSelect
							options={[
								{ label: 'Español', value: 'ESP' },
								{ label: 'Català', value: 'CAT' },
								{ label: 'Valencià', value: 'VAL' },
								{ label: 'Euskera', value: 'EUS' },
								{ label: 'Galego', value: 'GAL' },
								{ label: 'English', value: 'ENG' },
								{ label: 'Français', value: 'FRA' }
							]}
							onValueChange={values => setLanguages(values)}
							defaultValue={languages}
						/>
					</Field>
					<Label className="text-sm font-medium">Tipo de panel</Label>
					<Tabs value={mode} onValueChange={value => setMode(value as any)}>
						<TabsList>
							<TabsTrigger value="list">Listado de trenes</TabsTrigger>
							<TabsTrigger value="platform">Plataforma</TabsTrigger>
							<TabsTrigger value="clock">Reloj</TabsTrigger>
							{/* <TabsTrigger value="black-clock">Reloj oscuro</TabsTrigger> */}
							<TabsTrigger value="number">Número</TabsTrigger>
							{/* <TabsTrigger value="black-number">Número oscuro</TabsTrigger> */}
						</TabsList>
						<TabsContent value="list">
							<div>
								<Card>
									<CardContent className="grid md:grid-cols-2 gap-4">
										<Field>
											<Label className="text-xs font-medium">Modo</Label>
											<RadioGroup
												value={direction}
												onValueChange={value => {
													setDirection(value as 'salidas' | 'llegadas');
													if (value !== 'salidas') {
														setCountdown(false); // Countdown is not applicable for arrivals
													}
												}}
											>
												<div className="flex items-center gap-3">
													<RadioGroupItem value="salidas" id="tipo-salidas" />
													<Label htmlFor="tipo-salidas">Salidas</Label>
												</div>
												<div className="flex items-center gap-3">
													<RadioGroupItem value="llegadas" id="tipo-llegadas" />
													<Label htmlFor="tipo-llegadas">Llegadas</Label>
												</div>
											</RadioGroup>
										</Field>
										<Field>
											<Label className="text-xs font-medium">Servicios</Label>
											<div className="flex flex-col gap-3">
												{['cercanias', 'media-distancia', 'larga-distancia'].map(serviceType => (
													<div className="flex items-center gap-3" key={serviceType}>
														<Checkbox
															id={serviceType}
															disabled={
																services.has(serviceType as 'cercanias' | 'media-distancia' | 'larga-distancia') &&
																services.size === 1
															}
															checked={services.has(serviceType as 'cercanias' | 'media-distancia' | 'larga-distancia')}
															onCheckedChange={checked => {
																const newService = new Set(services);
																if (checked) {
																	newService.add(serviceType as 'cercanias' | 'media-distancia' | 'larga-distancia');
																} else {
																	newService.delete(serviceType as 'cercanias' | 'media-distancia' | 'larga-distancia');
																}
																setServices(newService);
															}}
														/>
														<Label htmlFor={serviceType}>
															{serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('-', ' ')}
														</Label>
													</div>
												))}
											</div>
										</Field>
										<Field className="md:col-span-2">
											<Label className="text-xs font-medium">Opciones</Label>
											<div className="grid md:grid-cols-2 gap-4">
												<div
													className="flex items-center gap-3"
													title="La cuenta atrás solo está disponible para salidas."
												>
													<Checkbox
														id="countdown"
														checked={countdown}
														disabled={direction !== 'salidas'} // Disable countdown for arrivals
														onCheckedChange={_checked => setCountdown(!countdown)}
													/>
													<Label htmlFor="countdown">Habilitar cuenta atrás</Label>
												</div>
												<div className="flex items-center gap-3">
													<Checkbox
														id="show-access"
														checked={showAccess}
														onCheckedChange={_checked => setShowAccess(!showAccess)}
													/>
													<Label htmlFor="show-access">Mostrar info. accesos</Label>
												</div>
												<div className="flex items-center gap-3">
													<Checkbox
														id="show-platform"
														checked={showPlatform}
														onCheckedChange={_checked => setShowPlatform(!showPlatform)}
													/>
													<Label htmlFor="show-platform">Mostrar andén</Label>
												</div>
												<div className="flex items-center gap-3">
													<Checkbox
														id="show-product"
														checked={showProduct}
														onCheckedChange={_checked => setShowProduct(!showProduct)}
													/>
													<Label htmlFor="show-product">Mostrar producto (AVE, Cercanías, etc.)</Label>
												</div>
												<div className="flex items-center gap-3">
													<Checkbox
														id="show-number"
														checked={showNumber}
														onCheckedChange={_checked => setShowNumber(!showNumber)}
													/>
													<Label htmlFor="show-number">Mostrar número de tren</Label>
												</div>
												<div className="flex items-center gap-3">
													<Checkbox
														id="show-platform-preview"
														checked={showPlatformPreview}
														onCheckedChange={_checked => setShowPlatformPreview(!showPlatformPreview)}
													/>
													<Label htmlFor="show-platform-preview">Mostrar vía anterior</Label>
												</div>
												<div className="flex items-center gap-3">
													<Checkbox
														id="show-header"
														checked={showHeader}
														onCheckedChange={_checked => setShowHeader(!showHeader)}
													/>
													<Label htmlFor="show-header">Mostrar cabecera</Label>
												</div>
											</div>
										</Field>
									</CardContent>
								</Card>
							</div>
						</TabsContent>
						<TabsContent value="platform">
							<Card>
								<CardContent className="grid md:grid-cols-2 gap-4">
									<Field>
										<Label className="text-xs font-medium">Vías (separadas por comas, sin espacios)</Label>
										<Input
											value={platformLocation}
											onChange={e => setPlatformLocation(e.target.value)}
											className="w-full"
										/>
									</Field>
									<Field>
										<Label className="text-xs font-medium">Modo</Label>
										<Select
											onValueChange={value => setPlatformMode(value as 'access' | 'check-in' | 'platform')}
											value={platformMode}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="access">Acceso</SelectItem>
												<SelectItem value="check-in">Check-in</SelectItem>
												<SelectItem value="platform">Plataforma</SelectItem>
											</SelectContent>
										</Select>
									</Field>
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="number">
							<Card>
								<CardContent className="grid md:grid-cols-2 gap-4">
									<Field>
										<Label className="text-xs font-medium">Vías (separadas por comas, sin espacios)</Label>
										<Input
											value={platformLocation}
											onChange={e => setPlatformLocation(e.target.value)}
											className="w-full"
										/>
									</Field>
									<Field>
										<Label className="text-xs font-medium">Número a mostrar si no hay trenes</Label>
										<Input
											value={numberIfNoTrains}
											onChange={e => setNumberIfNoTrains(e.target.value)}
											className="w-full"
										/>
									</Field>
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value="black-number">
							<Card>
								<CardContent className="grid md:grid-cols-2 gap-4">
									<Field>
										<Label className="text-xs font-medium">Vías (separadas por comas, sin espacios)</Label>
										<Input
											value={platformLocation}
											onChange={e => setPlatformLocation(e.target.value)}
											className="w-full"
										/>
									</Field>
									<Field>
										<Label className="text-xs font-medium">Número a mostrar si no hay trenes</Label>
										<Input
											value={numberIfNoTrains}
											onChange={e => setNumberIfNoTrains(e.target.value)}
											className="w-full"
										/>
									</Field>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
					<Field>
						<Label className="text-sm font-medium">Tamaño del texto</Label>
						<Card className="p-4 flex flex-row items-center">
							<Slider
								value={[fontSize]}
								onValueChange={value => setFontSize(value[0])}
								min={1}
								max={4}
								step={1}
								className="w-full"
							/>
							<span className="ml-4 text-sm font-mono">x{fontSize}</span>
						</Card>
					</Field>
					<Field>
						<Label className="text-sm font-medium">URL</Label>
						<Card className="p-4 flex flex-row items-center">
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
		</div>
	);
}

export default App;
