import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]',
	{
		variants: {
			variant: {
				default:
					'text-primary-foreground shadow border border-primary/90 bg-gradient-to-t dark:bg-gradient-to-b from-primary to-primary/80 hover:to-primary/80 hover:from-primary/95',
				destructive:
					'text-destructive-foreground shadow-sm border border-destructive bg-none !bg-destructive hover:bg-destructive/90',
				'destructive-outline':
					'border border-input shadow-sm hover:bg-destructive/20 hover:text-destructive hover:border-destructive',
				outline:
					'border border-input shadow-sm hover:bg-accent hover:text-accent-foreground dark:hover:bg-card bg-card',
				secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
				accent: 'bg-accent text-accent-foreground shadow-sm hover:bg-accent/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground active:shadow-none',
				link: 'text-primary underline-offset-4 hover:underline',
				white: 'bg-white text-black shadow-sm hover:bg-gray-100'
			},
			size: {
				default: 'h-9 px-4 py-2',
				sm: 'h-8 rounded-md px-3 text-xs',
				lg: 'h-10 rounded-md px-8',
				icon: 'h-9 w-9'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	loading?: boolean;
	leftSection?: React.ReactNode;
	rightSection?: React.ReactNode;
	children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, loading, leftSection, rightSection, children, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';

		return (
			<Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
				{((leftSection && loading) || (!leftSection && !rightSection && loading)) && (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				)}
				{!loading && leftSection && <div className="mr-2">{leftSection}</div>}
				{children}
				{!loading && rightSection && <div className="ml-2">{rightSection}</div>}
				{rightSection && loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
			</Comp>
		);
	}
);
Button.displayName = 'Button';

export { Button, buttonVariants };
