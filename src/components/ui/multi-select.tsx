// src/components/multi-select.tsx

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { CheckIcon, ChevronsUpDownIcon, Loader2, XIcon } from 'lucide-react';
import { Separator } from './separator';
import { Badge } from './badge';

const multiSelectVariants = cva('rounded-sm px-1.5', {
	variants: {
		variant: {
			default: '',
			secondary: 'border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80',
			destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
			inverted: 'inverted'
		}
	},
	defaultVariants: {
		variant: 'default'
	}
});

export interface MultiSelectProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof multiSelectVariants> {
	options: {
		label: string;
		value: string;
		icon?: React.ComponentType<{ className?: string }>;
	}[];
	onOpenChange?: (open: boolean) => void;
	loading?: boolean;
	placeholder?: string;
	searchPlaceholder?: string;
	onValueChange: (value: string[]) => void;
	defaultValue?: string[];
	animation?: number;
	className?: string;
	individualDelete?: boolean;
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
	(
		{
			options,
			onValueChange,
			onOpenChange,
			loading,
			variant,
			defaultValue = [],
			placeholder,
			searchPlaceholder,
			animation = 0,
			className,
			individualDelete = true,
			...props
		},
		ref
	) => {
		const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
		const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

		React.useEffect(() => {
			if (defaultValue.length > 0) {
				setSelectedValues(defaultValue);
			}
		}, [defaultValue]);

		React.useEffect(() => {
			if (onOpenChange) {
				onOpenChange(isPopoverOpen);
			}
		}, [isPopoverOpen]);

		const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === 'Enter') {
				setIsPopoverOpen(true);
			} else if (event.key === 'Backspace' && !event.currentTarget.value) {
				const newSelectedValues = [...selectedValues];
				newSelectedValues.pop();
				setSelectedValues(newSelectedValues);
				onValueChange(newSelectedValues);
			}
		};

		const toggleOption = (value: string) => {
			const newSelectedValues = selectedValues.includes(value)
				? selectedValues.filter(v => v !== value)
				: [...selectedValues, value];
			setSelectedValues(newSelectedValues);
			onValueChange(newSelectedValues);
		};

		const handleClear = () => {
			setSelectedValues([]);
			onValueChange([]);
		};

		const handleTogglePopover = () => {
			setIsPopoverOpen(prev => !prev);
		};

		return (
			<Popover
				open={isPopoverOpen}
				onOpenChange={open => {
					setIsPopoverOpen(open);
				}}
			>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						ref={ref}
						{...props}
						onClick={handleTogglePopover}
						className={cn(
							'flex w-full p-0 pr-4 rounded-md border min-h-9 h-auto items-center justify-between',
							selectedValues.length === 0 && 'text-muted-foreground',
							className
						)}
					>
						{selectedValues.length > 0 ? (
							<div className="flex justify-between items-center w-full">
								<div className="flex flex-wrap items-center gap-1.5 px-1.5 py-1.5">
									{selectedValues.map(value => {
										const option = options.find(o => o.value === value);
										const IconComponent = option?.icon;
										return (
											<Badge key={value} className={cn(multiSelectVariants({ variant, className }))}>
												{IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
												{option?.label}
												<XIcon
													className={cn('ml-2 h-3 w-3 cursor-pointer', individualDelete ? 'block' : 'hidden')}
													onClick={event => {
														event.stopPropagation();
														toggleOption(value);
													}}
												/>
											</Badge>
										);
									})}
								</div>
								<div className="flex items-center justify-between">
									<XIcon
										className="h-3.5 mx-2 cursor-pointer opacity-50"
										onClick={event => {
											event.stopPropagation();
											handleClear();
										}}
									/>
									<Separator orientation="vertical" className="flex min-h-6 h-full" />
									<ChevronsUpDownIcon className="ml-3 h-4 w-4 shrink-0 opacity-50" />
								</div>
							</div>
						) : (
							<div className="flex items-center justify-between w-full mx-auto text-muted-foreground">
								<span className="text-sm font-normal mx-3">{placeholder}</span>
								<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</div>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="p-0 w-[200px]" align="start" onEscapeKeyDown={() => setIsPopoverOpen(false)}>
					<Command
						filter={(value, search) => {
							if (value === '__add__') return 1;
							return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
						}}
					>
						{loading ? (
							<Loader2 className="mx-auto my-4 h-6 w-6" />
						) : (
							<>
								<CommandInput placeholder={searchPlaceholder} onKeyDown={handleInputKeyDown} />
								<CommandList>
									<CommandEmpty>Sin resultados</CommandEmpty>
									<CommandGroup>
										{options.map(option => {
											const isSelected = selectedValues.includes(option.value);
											return (
												<CommandItem
													key={option.value}
													onSelect={() => toggleOption(option.value)}
													style={{
														pointerEvents: 'auto',
														opacity: 1
													}}
													className="cursor-pointer"
													value={option.label}
												>
													<div
														className={cn(
															'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
															isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
														)}
													>
														<CheckIcon className="h-4 w-4" />
													</div>
													{option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
													<span>{option.label}</span>
												</CommandItem>
											);
										})}
									</CommandGroup>
								</CommandList>
							</>
						)}
					</Command>
				</PopoverContent>
			</Popover>
		);
	}
);

MultiSelect.displayName = 'MultiSelect';
