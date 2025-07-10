import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Field } from '../field';
import { PanelHeader, PanelMode, type HeaderOptionsState } from '../panel/PanelHeader';
import { ListOptions, type ListOptionsState } from '../panel/ListOptions';
import { PlatformOptions, type PlatformOptionsState } from '../panel/PlatformOptions';
import { NumberOptions, type NumberOptionsState } from '../panel/NumberOptions';

export default function Panel({
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
		<Card className="w-full h-fit">
			<CardContent className="space-y-4">
				<PanelHeader value={headerOptions} onChange={setHeaderOptions} />
				<Label className="text-sm font-medium">Tipo de panel</Label>
				<Tabs
					value={headerOptions.mode}
					onValueChange={mode => setHeaderOptions({ ...headerOptions, mode: mode as PanelMode })}
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
			</CardContent>
		</Card>
	);
}
