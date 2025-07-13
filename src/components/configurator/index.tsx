import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Field } from '../field';
import { PanelHeader, PanelMode, type HeaderOptionsState } from '../configurator/PanelHeader';
import { ListOptions, type ListOptionsState } from '../configurator/ListOptions';
import { PlatformOptions, type PlatformOptionsState } from '../configurator/PlatformOptions';
import { NumberOptions, type NumberOptionsState } from '../configurator/NumberOptions';
import { ScrollArea } from '../ui/scroll-area';
import { ArrowDownLeft, ArrowUpRight, ClockIcon, HashIcon, TrainTrackIcon } from 'lucide-react';

export default function ConfiguratorForm({
	headerOptions,
	setHeaderOptions,
	listOptions,
	setListOptions,
	platformOptions,
	setPlatformOptions,
	numberOptions,
	setNumberOptions,
	fontSize,
	setFontSize
}: {
	headerOptions: HeaderOptionsState;
	setHeaderOptions: (next: HeaderOptionsState) => void;
	listOptions: ListOptionsState;
	setListOptions: (next: ListOptionsState) => void;
	platformOptions: PlatformOptionsState;
	setPlatformOptions: (next: PlatformOptionsState) => void;
	numberOptions: NumberOptionsState;
	setNumberOptions: (next: NumberOptionsState) => void;
	fontSize: number;
	setFontSize: (next: number) => void;
}) {
	return (
		<Card className="w-full max-w-full overflow-hidden h-fit">
			<CardContent className="space-y-4">
				<PanelHeader value={headerOptions} onChange={setHeaderOptions} />
				<Label className="text-sm font-medium">Tipo de panel</Label>
				<Tabs
					value={headerOptions.mode}
					onValueChange={mode => setHeaderOptions({ ...headerOptions, mode: mode as PanelMode })}
				>
					<ScrollArea className="w-full">
						<div className="w-full overflow-x-auto pb-2">
							<TabsList>
								<TabsTrigger value={PanelMode.Departures}>
									<ArrowUpRight className="mr-1" size={16} />
									Salidas
								</TabsTrigger>
								<TabsTrigger value={PanelMode.Arrivals}>
									<ArrowDownLeft className="mr-1" size={16} />
									Llegadas
								</TabsTrigger>
								<TabsTrigger value={PanelMode.Platform}>
									<TrainTrackIcon className="mr-1" size={16} />
									Vías
								</TabsTrigger>
								<TabsTrigger value={PanelMode.Clock}>
									<ClockIcon className="mr-1" size={16} />
									Reloj
								</TabsTrigger>
								<TabsTrigger value={PanelMode.Number}>
									<HashIcon className="mr-1" size={16} />
									Número
								</TabsTrigger>
							</TabsList>
						</div>
					</ScrollArea>
					<TabsContent value={PanelMode.Arrivals}>
						<Card>
							<CardContent className="grid md:grid-cols-2 gap-4 py-0">
								<ListOptions value={listOptions} onChange={setListOptions} />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value={PanelMode.Departures}>
						<Card>
							<CardContent className="grid md:grid-cols-2 gap-4 py-0">
								<ListOptions value={listOptions} onChange={setListOptions} />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value={PanelMode.Platform}>
						<Card>
							<CardContent className="grid md:grid-cols-2 gap-4">
								<PlatformOptions value={platformOptions} onChange={setPlatformOptions} />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value={PanelMode.Clock}>
						<Card>
							<CardContent className="grid md:grid-cols-2 gap-4">
								<NumberOptions value={numberOptions} onChange={setNumberOptions} />
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value={PanelMode.Number}>
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
			</CardContent>
		</Card>
	);
}
