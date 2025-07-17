import { CopyIcon, ExternalLinkIcon, LaptopIcon, SmartphoneIcon } from 'lucide-react';
import { Field } from '../field';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function Preview({ url }: { url: string }) {
	const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

	return (
		<Card className="h-fit">
			<CardContent className="space-y-4">
				<Field>
					<Label className="text-sm font-medium">Vista previa</Label>
					<iframe
						src={`${url}&preview=true`}
						className={cn('w-full rounded-sm border', orientation === 'landscape' ? 'aspect-video' : 'aspect-[9/16]')}
						title="ADIF Panel Preview"
					/>
					<Button
						variant="outline"
						className="mt-2 w-fit"
						size="sm"
						leftSection={
							orientation === 'landscape' ? <LaptopIcon className="h-4 w-4" /> : <SmartphoneIcon className="h-4 w-4" />
						}
						onClick={() => setOrientation(orientation === 'landscape' ? 'portrait' : 'landscape')}
					>
						{orientation === 'landscape' ? '16:9' : '9:16'}
					</Button>
				</Field>
				<Field>
					<Label className="text-sm font-medium">URL</Label>
					<Card className="p-4 flex flex-row items-center border-dashed">
						<span className="break-all font-mono text-sm">{url}</span>
						<CopyIcon
							className="ml-2 min-h-5 min-w-5 cursor-pointer"
							onClick={() => {
								navigator.clipboard.writeText(url);
								toast.success('URL copiada al portapapeles');
							}}
						/>
					</Card>
				</Field>
				<Button
					variant="default"
					className="mt-4 w-full"
					size="lg"
					leftSection={<ExternalLinkIcon className="h-4 w-4" />}
					onClick={() => {
						window.open(url, '_blank');
					}}
				>
					Ir al Panel
				</Button>
			</CardContent>
		</Card>
	);
}
