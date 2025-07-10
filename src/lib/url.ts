import type { NumberOptionsState } from '@/components/panel/NumberOptions';
import { Direction, ServiceType, type ListOptionsState } from '../components/panel/ListOptions';
import type { PlatformOptionsState } from '../components/panel/PlatformOptions';
import { PanelMode, type HeaderOptionsState } from '@/components/panel/PanelHeader';

export function buildUrl({
	headerOptions,
	listOptions,
	platformOptions,
	numberOptions,
	fontSize
}: {
	headerOptions: HeaderOptionsState;
	listOptions: ListOptionsState;
	platformOptions: PlatformOptionsState;
	numberOptions: NumberOptionsState;
	fontSize: number;
}): string {
	const params: Record<string, string> = {
		rutaRecursos: '../../../recursos'
	};

	// HEADER CONFIGURATION
	params['IdEstacion'] = headerOptions.stationCode;
	if (headerOptions.languages.length > 0) {
		params['languages'] = headerOptions.languages.join(',');
	}

	switch (headerOptions.mode) {
		case PanelMode.List:
			switch (listOptions.direction) {
				case Direction.Departures:
					params['interfaz'] = 'adif-gravita-departures';
					break;
				case Direction.Arrivals:
					params['interfaz'] = 'adif-gravita-arrivals';
					break;
			}
			break;
		case PanelMode.Platform:
			params['interfaz'] = 'adif-gravita-platform';
			break;
		case PanelMode.Clock:
			params['interfaz'] = 'adif-gravita-clock';
			break;
		case PanelMode.BlackClock:
			params['interfaz'] = 'adif-gravita-black-clock';
			break;
		case PanelMode.Number:
			params['interfaz'] = 'adif-gravita-number';
			break;
		case PanelMode.BlackNumber:
			params['interfaz'] = 'adif-gravita-black-number';
			break;
	}

	// MODE SPECIFIC CONFIGURATION
	if (headerOptions.mode === 'list') {
		params['traffic'] = Array.from(listOptions.services)
			.map(service => {
				switch (service) {
					case ServiceType.Cercanias:
						return 'C';
					case ServiceType.LargaDistancia:
						return 'L';
					case ServiceType.MediaDistancia:
						return 'R';
					default:
						return '';
				}
			})
			.join(',');

		if (listOptions.subtitle) {
			const subtitle = listOptions.subtitle.replace(/\$$/, listOptions.subtitleParam);
			params['subtitle'] = subtitle;
		}

		if (listOptions.productFilter.size > 0) {
			params['product-filter'] = Array.from(listOptions.productFilter).join(',');
		}
		if (listOptions.companyFilter.size > 0) {
			params['company-filter'] = Array.from(listOptions.companyFilter).join(',');
		}

		params['countdown'] = listOptions.countdown ? 'true' : 'false';
		params['show-access'] = listOptions.showAccess ? 'true' : 'false';
		params['show-platform'] = listOptions.showPlatform ? 'true' : 'false';
		params['show-product'] = listOptions.showProduct ? 'true' : 'false';
		params['show-number'] = listOptions.showNumber ? 'true' : 'false';
		params['show-platform-preview'] = listOptions.showPlatformPreview ? 'true' : 'false';
		params['show-header'] = listOptions.showHeader ? 'true' : 'false';
	} else if (headerOptions.mode === 'platform') {
		params['platform-location'] = platformOptions.platformLocation;
		params['number-if-no-trains'] = numberOptions.numberIfNoTrains;
		params['platform-mode'] = platformOptions.platformMode;
	} else if (headerOptions.mode === 'clock' || headerOptions.mode === 'black-clock') {
		params['platform-location'] = platformOptions.platformLocation;
		params['number-if-no-trains'] = numberOptions.numberIfNoTrains;
	} else if (headerOptions.mode === 'number' || headerOptions.mode === 'black-number') {
		params['platform-location'] = numberOptions.platformLocation;
		params['number-if-no-trains'] = numberOptions.numberIfNoTrains;
	}

	// FONT SIZE CONFIGURATION
	params['font-size'] = fontSize.toString();

	return (
		'https://info.adif.es/?' +
		new URLSearchParams({
			s: headerOptions.stationCode,
			a: `a&${Object.entries(params)
				.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
				.join('&')}#`
		}).toString()
	);
}
