export function buildUrl({
	stationCode,
	languages,
	mode,

	direction,
	services,
	countdown,
	showAccess,
	showPlatform,
	showProduct,
	showNumber,
	showPlatformPreview,
	showHeader,

	platformLocation,
	numberIfNoTrains,
	platformMode,

	fontSize
}: {
	stationCode: string;
	languages: string[];
	mode: 'list' | 'platform' | 'clock' | 'black-clock' | 'number' | 'black-number';

	direction: 'salidas' | 'llegadas';
	services: Set<'cercanias' | 'media-distancia' | 'larga-distancia'>;
	countdown: boolean;
	showAccess: boolean;
	showPlatform: boolean;
	showProduct: boolean;
	showNumber: boolean;
	showPlatformPreview: boolean;
	showHeader: boolean;

	platformLocation: string;
	numberIfNoTrains: string;
	platformMode: 'access' | 'check-in' | 'platform';

	fontSize: number;
}): string {
	const params: Record<string, string> = {
		rutaRecursos: '../../../recursos'
	};

	params['IdEstacion'] = stationCode;
	if (languages.length > 0) {
		params['languages'] = languages.join(',');
	}

	switch (mode) {
		case 'list':
			switch (direction) {
				case 'salidas':
					params['interfaz'] = 'adif-gravita-departures';
					break;
				case 'llegadas':
					params['interfaz'] = 'adif-gravita-arrivals';
					break;
			}
			break;
		case 'platform':
			params['interfaz'] = 'adif-gravita-platform';
			break;
		case 'clock':
			params['interfaz'] = 'adif-gravita-clock';
			break;
		case 'black-clock':
			params['interfaz'] = 'adif-gravita-black-clock';
			break;
		case 'number':
			params['interfaz'] = 'adif-gravita-number';
			break;
		case 'black-number':
			params['interfaz'] = 'adif-gravita-black-number';
			break;
	}

	if (mode === 'list') {
		params['traffic'] = Array.from(services)
			.map(service => {
				switch (service) {
					case 'cercanias':
						return 'C';
					case 'larga-distancia':
						return 'L';
					case 'media-distancia':
						return 'R';
					default:
						return '';
				}
			})
			.join(',');

		if (params['traffic'] === 'C') {
			params['subtitle'] = 'CERC';
		} else if (params['traffic'] === 'L') {
			params['subtitle'] = 'LD';
		} else if (params['traffic'] === 'R') {
			params['subtitle'] = 'MD';
		}

		params['countdown'] = countdown ? 'true' : 'false';

		params['show-access'] = showAccess ? 'true' : 'false';
		params['show-platform'] = showPlatform ? 'true' : 'false';
		params['show-product'] = showProduct ? 'true' : 'false';
		params['show-number'] = showNumber ? 'true' : 'false';
		params['show-platform-preview'] = showPlatformPreview ? 'true' : 'false';
		params['show-header'] = showHeader ? 'true' : 'false';
	} else if (mode === 'platform') {
		params['platform-location'] = platformLocation;
		params['number-if-no-trains'] = numberIfNoTrains;
		params['platform-mode'] = platformMode;
	} else if (mode === 'clock' || mode === 'black-clock') {
		params['platform-location'] = platformLocation;
		params['number-if-no-trains'] = numberIfNoTrains;
	}

	params['font-size'] = fontSize.toString();

	return (
		'https://info.adif.es/?' +
		new URLSearchParams({
			s: stationCode, // This is the station code, it should be included in the URL so that the app can fetch the correct data
			a: `a&${Object.entries(params)
				.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
				.join('&')}#`
		}).toString()
	);
}
