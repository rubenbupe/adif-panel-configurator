import { Field } from '../field';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export interface NumberOptionsState {
	platformLocation: string;
	numberIfNoTrains: string;
}

export function NumberOptions({
	value,
	onChange
}: {
	value: NumberOptionsState;
	onChange: (next: NumberOptionsState) => void;
}) {
	const onValueChange = (data: Partial<NumberOptionsState>) => {
		onChange({
			...value,
			...data
		});
	};

	return (
		<>
			<Field>
				<Label className="text-xs font-medium">Vías (separadas por comas, sin espacios)</Label>
				<Input
					value={value.platformLocation}
					onChange={e => onValueChange({ platformLocation: e.target.value })}
					className="w-full"
				/>
			</Field>
			<Field>
				<Label className="text-xs font-medium">Número a mostrar si no hay trenes</Label>
				<Input
					value={value.numberIfNoTrains}
					onChange={e => onValueChange({ numberIfNoTrains: e.target.value })}
					className="w-full"
				/>
			</Field>
		</>
	);
}
