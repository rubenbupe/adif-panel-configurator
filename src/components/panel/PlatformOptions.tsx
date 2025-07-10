import { Field } from '../field';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export enum PlatformMode {
	Access = 'access',
	CheckIn = 'check-in',
	Platform = 'platform'
}

export interface PlatformOptionsState {
	platformLocation: string;
	platformMode: PlatformMode;
}

export function PlatformOptions({
	value,
	onChange
}: {
	value: PlatformOptionsState;
	onChange: (next: PlatformOptionsState) => void;
}) {
	const onValueChange = (data: Partial<PlatformOptionsState>) => {
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
				<Label className="text-xs font-medium">Modo</Label>
				<Select
					onValueChange={platformMode => onValueChange({ platformMode: platformMode as PlatformMode })}
					value={value.platformMode}
				>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={PlatformMode.Access}>Acceso</SelectItem>
						<SelectItem value={PlatformMode.CheckIn}>Check-in</SelectItem>
						<SelectItem value={PlatformMode.Platform}>Plataforma</SelectItem>
					</SelectContent>
				</Select>
			</Field>
		</>
	);
}
