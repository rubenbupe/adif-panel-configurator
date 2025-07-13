import { Field } from '../field';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { MultiSelect } from '../ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

export enum ServiceType {
	Cercanias = 'cercanias',
	Regional = 'regional',
	LargaDistancia = 'larga-distancia',
	AltaVelocidad = 'alta-velocidad',
	ServicioInterno = 'servicio-interno'
}

export enum ListInterface {
	Default = 'default',
	Cercanias = 'cercanias'
}

export enum Product {
	IRYO = 'IRYO',
	AVLO = 'AVLO',
	MD = 'MD',
	AVANT = 'AVANT',
	REX = 'REX',
	ICITY = 'ICITY',
	AVE = 'AVE',
	SSERV = 'SSERV',
	CERCAN = 'CERCAN',
	OUIGO = 'OUIGO',
	ALVIA = 'ALVIA'
}

export enum Company {
	Renfe = 'RENFE',
	Iryo = 'IRYO',
	Ouigo = 'OUIGO'
}

export enum Subtitle {
	AV = 'AV',
	CERC = 'CERC',
	CERCMD = 'CERCMD',
	MD = 'MD',
	LD = 'LD',
	LDAV = 'LDAV',
	MDLD = 'MDLD',
	MDLDCONV = 'MDLDCONV',
	CERCMDLDCONV = 'CERCMDLDCONV',
	AEROPUERTO = 'AEROPUERTO',
	OPERADOR = 'OPERADOR:$',
	VIA = 'VIA:$'
}

export interface ListOptionsState {
	services: Set<ServiceType>;
	interfaz: ListInterface;
	countdown: boolean;
	showAccess: boolean;
	showPlatform: boolean;
	showProduct: boolean;
	showNumber: boolean;
	showPlatformPreview: boolean;
	showHeader: boolean;
	productFilter: Set<Product>;
	companyFilter: Set<Company>;
	subtitle: Subtitle | null;
	subtitleParam: string;
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
			<Field className="md:col-span-2">
				<Label className="text-xs font-medium">Interfaz</Label>
				<RadioGroup
					value={value.interfaz}
					onValueChange={interfaz => onValueChange({ interfaz: interfaz as ListInterface })}
				>
					<div className="grid grid-cols-2 gap-4">
						<div className="flex items-center gap-3">
							<RadioGroupItem id="default" value={ListInterface.Default} />
							<Label htmlFor="default">Predeterminada</Label>
						</div>
						<div className="flex items-center gap-3">
							<RadioGroupItem id="cercanias" value={ListInterface.Cercanias} />
							<Label htmlFor="cercanias">Cercanías</Label>
						</div>
					</div>
				</RadioGroup>
			</Field>
			<Field className="md:col-span-2">
				<Label className="text-xs font-medium">Servicios</Label>
				<div className="flex flex-col gap-3 grid md:grid-cols-2">
					{[
						ServiceType.Cercanias,
						ServiceType.Regional,
						ServiceType.LargaDistancia,
						ServiceType.AltaVelocidad,
						ServiceType.ServicioInterno
					].map(serviceType => (
						<div className="flex items-center gap-3" key={serviceType}>
							<Checkbox
								id={serviceType}
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
			<Field className="md:col-span-2">
				<Label className="text-xs font-medium">Productos</Label>
				<MultiSelect
					options={[
						{ label: 'Iryo', value: Product.IRYO },
						{ label: 'AVE', value: Product.AVE },
						{ label: 'Ouigo', value: Product.OUIGO },
						{ label: 'Avlo', value: Product.AVLO },
						{ label: 'Alvia', value: Product.ALVIA },
						{ label: 'Avant', value: Product.AVANT },
						{ label: 'Media Distancia', value: Product.MD },
						{ label: 'Reg. Exprés', value: Product.REX },
						{ label: 'Intercity', value: Product.ICITY },
						{ label: 'Servicions Especiales', value: Product.SSERV },
						{ label: 'Cercanías', value: Product.CERCAN }
					]}
					onValueChange={products => onValueChange({ productFilter: new Set(products as Product[]) })}
					value={Array.from(value.productFilter)}
				/>
			</Field>
			<Field className="md:col-span-2">
				<Label className="text-xs font-medium">Compañías</Label>
				<MultiSelect
					options={[
						{ label: 'Renfe', value: Company.Renfe },
						{ label: 'Iryo', value: Company.Iryo },
						{ label: 'Ouigo', value: Company.Ouigo }
					]}
					onValueChange={companies => onValueChange({ companyFilter: new Set(companies as Company[]) })}
					value={Array.from(value.companyFilter)}
				/>
			</Field>
			<Field className={cn(value.subtitle?.endsWith(':$') ? '' : 'md:col-span-2')}>
				<Label className="text-xs font-medium">Subtítulo</Label>
				<Select
					value={value.subtitle as string}
					onValueChange={subtitle => onValueChange({ subtitle: subtitle as Subtitle })}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={Subtitle.AV}>Alta Velocidad</SelectItem>
						<SelectItem value={Subtitle.LDAV}>Larga Distancia · Alta Velocidad</SelectItem>
						<SelectItem value={Subtitle.LD}>Larga Distancia</SelectItem>
						<SelectItem value={Subtitle.CERC}>Cercanías</SelectItem>
						<SelectItem value={Subtitle.CERCMD}>Cercanías · Regional</SelectItem>
						<SelectItem value={Subtitle.MD}>Regional</SelectItem>
						<SelectItem value={Subtitle.MDLD}>Regional · Larga Distancia</SelectItem>
						<SelectItem value={Subtitle.MDLDCONV}>Regional · Larga Distancia Convencional</SelectItem>
						<SelectItem value={Subtitle.CERCMDLDCONV}>Cercanías · Regional · Larga Distancia Convencional</SelectItem>
						<SelectItem value={Subtitle.AEROPUERTO}>Conexiones al aeropuerto</SelectItem>
						<SelectItem value={Subtitle.OPERADOR}>Servicios operados por ...</SelectItem>
						<SelectItem value={Subtitle.VIA}>Vía ...</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<Field className={cn(!value.subtitle?.endsWith(':$') && 'hidden')}>
				<Label className="text-xs font-medium">Subtítulo</Label>
				<Input
					value={value.subtitleParam}
					onChange={e => onValueChange({ subtitleParam: e.target.value })}
					placeholder="Parámetro del subtítulo"
					className="w-full"
				/>
			</Field>
			<Accordion type="single" collapsible className="md:col-span-2 -mb-4">
				<AccordionItem value="column-options">
					<AccordionTrigger>Configuración de columnas</AccordionTrigger>
					<AccordionContent>
						<div className="grid md:grid-cols-2 gap-4">
							<div className="flex items-center gap-3">
								<Checkbox
									id="countdown"
									checked={value.countdown}
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
