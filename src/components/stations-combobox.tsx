'use client';

import * as React from 'react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import stations from '@/constants/stations-sm.json';

export function StationsCombobox({ onChange, value }: { onChange: (value: string) => void; value: string }) {
	const [open, setOpen] = React.useState(false);

	const selectedStation = React.useMemo(() => {
		return stations.find(station => station.code === value);
	}, [value]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" role="combobox" aria-expanded={open} className="justify-between w-full">
					{value ? (
						<span className="truncate">
							<span className="font-medium">{selectedStation?.description}</span>
							<span className="text-xs text-foreground/60 ml-2">{selectedStation?.code}</span>
						</span>
					) : (
						'Selecciona una estación...'
					)}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-0" align="start">
				<Command>
					<CommandInput placeholder="Busca una estación..." />
					<CommandList>
						<CommandEmpty>No se ha encontrado la estación.</CommandEmpty>
						<CommandGroup>
							{stations.map(station => (
								<CommandItem
									key={station.code}
									value={station.code}
									keywords={[station.code, station.description]}
									onSelect={currentValue => {
										onChange(currentValue === value ? '' : currentValue);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={cn('mr-2 h-4 w-4 min-h-4 min-w-4', value === station.code ? 'opacity-100' : 'opacity-0')}
									/>
									<div>
										<div>{station.description}</div>
										<div className=" text-xs text-foreground/60">{station.code}</div>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
