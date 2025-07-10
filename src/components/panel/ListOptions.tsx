import { Field } from '../field';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

export enum Direction {
	Departures = 'departures',
	Arrivals = 'arrivals'
}

export enum ServiceType {
	Cercanias = 'cercanias',
	MediaDistancia = 'media-distancia',
	LargaDistancia = 'larga-distancia'
}

export interface ListOptionsState {
	direction: Direction;
	services: Set<ServiceType>;
	countdown: boolean;
	showAccess: boolean;
	showPlatform: boolean;
	showProduct: boolean;
	showNumber: boolean;
	showPlatformPreview: boolean;
	showHeader: boolean;
}

export function ListOptions({
	value,
	onChange
}: {
	value: ListOptionsState;
	onChange: (next: ListOptionsState) => void;
}) {
	const onValueChange = (data: Partial<ListOptionsState>) => {
		onChange({
			...value,
			...data
		});
	};

	return (
		<>
			<Field>
				<Label className="text-xs font-medium">Modo</Label>
				<RadioGroup
					value={value.direction}
					onValueChange={direction => {
						onValueChange({
							direction: direction as Direction,
							countdown: direction !== Direction.Departures ? false : value.countdown
						});
					}}
				>
					<div className="flex items-center gap-3">
						<RadioGroupItem value={Direction.Departures} id="tipo-salidas" />
						<Label htmlFor="tipo-salidas">Salidas</Label>
					</div>
					<div className="flex items-center gap-3">
						<RadioGroupItem value={Direction.Arrivals} id="tipo-llegadas" />
						<Label htmlFor="tipo-llegadas">Llegadas</Label>
					</div>
				</RadioGroup>
			</Field>
			<Field>
				<Label className="text-xs font-medium">Servicios</Label>
				<div className="flex flex-col gap-3">
					{[ServiceType.Cercanias, ServiceType.MediaDistancia, ServiceType.LargaDistancia].map(serviceType => (
						<div className="flex items-center gap-3" key={serviceType}>
							<Checkbox
								id={serviceType}
								disabled={value.services.has(serviceType) && value.services.size === 1}
								checked={value.services.has(serviceType)}
								onCheckedChange={checked => {
									const newService = new Set(value.services);
									if (checked) {
										newService.add(serviceType);
									} else {
										newService.delete(serviceType);
									}
									onValueChange({ services: newService });
								}}
							/>
							<Label htmlFor={serviceType}>
								{serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('-', ' ')}
							</Label>
						</div>
					))}
				</div>
			</Field>
			<Accordion type="single" collapsible className="md:col-span-2 -mb-4">
				<AccordionItem value="advanced-options">
					<AccordionTrigger>Opciones avanzadas</AccordionTrigger>
					<AccordionContent>
						<div className="grid md:grid-cols-2 gap-4">
							<div className="flex items-center gap-3" title="La cuenta atrás solo está disponible para salidas.">
								<Checkbox
									id="countdown"
									checked={value.countdown}
									disabled={value.direction !== Direction.Departures}
									onCheckedChange={() => onValueChange({ countdown: !value.countdown })}
								/>
								<Label htmlFor="countdown">Mostrar cuenta atrás</Label>
							</div>
							<div className="flex items-center gap-3">
								<Checkbox
									id="show-access"
									checked={value.showAccess}
									onCheckedChange={() => onValueChange({ showAccess: !value.showAccess })}
								/>
								<Label htmlFor="show-access">Mostrar info. accesos</Label>
							</div>
							<div className="flex items-center gap-3">
								<Checkbox
									id="show-platform"
									checked={value.showPlatform}
									onCheckedChange={() => onValueChange({ showPlatform: !value.showPlatform })}
								/>
								<Label htmlFor="show-platform">Mostrar andén</Label>
							</div>
							<div className="flex items-center gap-3">
								<Checkbox
									id="show-product"
									checked={value.showProduct}
									onCheckedChange={() => onValueChange({ showProduct: !value.showProduct })}
								/>
								<Label htmlFor="show-product">Mostrar producto (AVE, Cercanías...)</Label>
							</div>
							<div className="flex items-center gap-3">
								<Checkbox
									id="show-number"
									checked={value.showNumber}
									onCheckedChange={() => onValueChange({ showNumber: !value.showNumber })}
								/>
								<Label htmlFor="show-number">Mostrar número de tren</Label>
							</div>
							<div className="flex items-center gap-3">
								<Checkbox
									id="show-platform-preview"
									checked={value.showPlatformPreview}
									onCheckedChange={() => onValueChange({ showPlatformPreview: !value.showPlatformPreview })}
								/>
								<Label htmlFor="show-platform-preview">Mostrar vía anterior</Label>
							</div>
							<div className="flex items-center gap-3">
								<Checkbox
									id="show-header"
									checked={value.showHeader}
									onCheckedChange={() => onValueChange({ showHeader: !value.showHeader })}
								/>
								<Label htmlFor="show-header">Mostrar cabecera</Label>
							</div>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</>
	);
}
