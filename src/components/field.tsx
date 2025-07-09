import { cn } from '@/lib/utils';

export function Field({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn('flex flex-col space-y-2', className)} {...rest}>
			{children}
		</div>
	);
}
