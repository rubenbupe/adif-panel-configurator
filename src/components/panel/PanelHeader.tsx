import { Field } from '../field';
import { Label } from '../ui/label';
import { StationsCombobox } from '../stations-combobox';
import { MultiSelect } from '../ui/multi-select';

export enum PanelMode {
	List = 'list',
	Platform = 'platform',
	Clock = 'clock',
	BlackClock = 'black-clock',
	Number = 'number',
	BlackNumber = 'black-number'
}

export enum Language {
	ESP = 'ESP',
	CAT = 'CAT',
	VAL = 'VAL',
	EUS = 'EUS',
	GAL = 'GAL',
	ENG = 'ENG',
	FRA = 'FRA'
}

export interface HeaderOptionsState {
	stationCode: string;
	languages: Language[];
	mode: PanelMode;
}

export function PanelHeader({
	value,
	onChange
}: {
	value: HeaderOptionsState;
	onChange: (next: HeaderOptionsState) => void;
}) {
	const onValueChange = (data: Partial<HeaderOptionsState>) => {
		onChange({
			...value,
			...data
		});
	};

	return (
		<>
			<Field>
				<Label className="text-sm font-medium">Estación</Label>
				<StationsCombobox onChange={stationCode => onValueChange({ stationCode })} value={value.stationCode} />
			</Field>
			<Field>
				<Label className="text-sm font-medium">
					Idiomas <span className="text-xs text-foreground/60">(querida)</span>
				</Label>
				<MultiSelect
					options={[
						{ label: 'Español', value: Language.ESP },
						{ label: 'Català', value: Language.CAT },
						{ label: 'Valencià', value: Language.VAL },
						{ label: 'Euskera', value: Language.EUS },
						{ label: 'Galego', value: Language.GAL },
						{ label: 'English', value: Language.ENG },
						{ label: 'Français', value: Language.FRA }
					]}
					onValueChange={languages => onValueChange({ languages: languages as Language[] })}
					defaultValue={value.languages}
				/>
			</Field>
		</>
	);
}
