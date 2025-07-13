import GravitaWrapper from '@/components/panel/GravitaWrapper';
import { useSearchParams } from 'react-router';
import { useMemo } from 'react';
import { urlParamsToData } from '@/lib/props';

export default function Panel() {
	const [searchParams] = useSearchParams();
	const data = useMemo(() => urlParamsToData(searchParams), [searchParams]);
	return (
		<div className="w-screen min-h-screen max-w-screen flex flex-col">
			<GravitaWrapper {...data} />
		</div>
	);
}
