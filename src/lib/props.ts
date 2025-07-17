import { PanelMode, type HeaderOptionsState } from '@/components/configurator/PanelHeader';
import type { NumberOptionsState } from '@/components/configurator/NumberOptions';
import type { PlatformOptionsState } from '@/components/configurator/PlatformOptions';
import { ListInterface, ServiceType, type ListOptionsState } from '../components/configurator/ListOptions';
import { PANEL_URL } from '@/constants';

// Tipos estrictos para los datos de URL y props de Gravita
export interface PanelUrlParamsData {
	stationCode: string;
	interfaz: string;
	traffic: string[];
	languages: string[];
	showHeader: boolean;
	showAccess: boolean;
	showPlatform: boolean;
	showProduct: boolean;
	showNumber: boolean;
	countdown: boolean;
	productFilter: string[];
	companyFilter: string[];
	subtitle: string;
	subtitleParam?: string;
	platformLocation: string;
	platformMode: string;
	platformFilter: string;
	fontSize: number;
	numberIfNoTrains?: string;
	preview?: boolean;
}

export interface PanelGravitaProps {
	stationCode: string;
	interfaz: string;
	languages: string;
	fontSize: number;
	traffic?: string;
	showHeader?: boolean;
	showAccess?: boolean;
	showPlatform?: boolean;
	showProduct?: boolean;
	showNumber?: boolean;
	countdown?: boolean;
	productFilter?: string;
	companyFilter?: string;
	subtitle?: string;
	platformLocation?: string;
	platformMode?: string;
	numberIfNoTrains?: string;
}

const allowedPropsByMode: Record<PanelMode, string[]> = {
	[PanelMode.Arrivals]: [
		'interfaz',
		'stationCode',
		'traffic',
		'languages',
		'fontSize',
		'showHeader',
		'showAccess',
		'showPlatform',
		'showProduct',
		'showNumber',
		'countdown',
		'productFilter',
		'companyFilter',
		'platformFilter',
		'subtitle',
		'subtitleParam'
	],
	[PanelMode.Departures]: [
		'interfaz',
		'stationCode',
		'traffic',
		'languages',
		'fontSize',
		'showHeader',
		'showAccess',
		'showPlatform',
		'showProduct',
		'showNumber',
		'countdown',
		'productFilter',
		'companyFilter',
		'platformFilter',
		'subtitle',
		'subtitleParam'
	],
	[PanelMode.Platform]: [
		'interfaz',
		'stationCode',
		'traffic',
		'languages',
		'fontSize',
		'platformLocation',
		'platformMode'
	],
	[PanelMode.Number]: ['interfaz', 'stationCode', 'traffic', 'languages', 'fontSize', 'platformLocation'],
	[PanelMode.Clock]: ['interfaz', 'stationCode', 'traffic', 'languages', 'fontSize']
};

export function modeToInterfaz(mode: PanelMode, listInterfaz: ListInterface): string {
	switch (mode) {
		case PanelMode.Arrivals:
			switch (listInterfaz) {
				case ListInterface.Cercanias:
					return 'adif-gravita-arrivals-cercanias';
				case ListInterface.Old:
					return 'adif-gravita-arrivals-old';
				default:
					return 'adif-gravita-arrivals';
			}
		case PanelMode.Departures:
			switch (listInterfaz) {
				case ListInterface.Cercanias:
					return 'adif-gravita-departures-cercanias';
				case ListInterface.Old:
					return 'adif-gravita-departures-old';
				default:
					return 'adif-gravita-departures';
			}
		case PanelMode.Platform:
			return 'adif-gravita-platform';
		case PanelMode.Clock:
			return 'adif-gravita-clock';
		case PanelMode.Number:
			return 'adif-gravita-number';
	}
}

export function isDefaultInterfaz(interfaz: string): boolean {
	return (
		interfaz === 'adif-gravita-arrivals' ||
		interfaz === 'adif-gravita-departures' ||
		interfaz === 'adif-gravita-platform' ||
		interfaz === 'adif-gravita-clock' ||
		interfaz === 'adif-gravita-number'
	);
}

export function dataToUrlParams({
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
	const mode = headerOptions.mode;
	const allowed = allowedPropsByMode[mode] || [];
	const allProps: PanelUrlParamsData = {
		stationCode: headerOptions.stationCode,
		languages: headerOptions.languages, // corregido: es string[]
		fontSize,
		interfaz: modeToInterfaz(mode, listOptions.interfaz),
		traffic: listOptions.services && listOptions.services.size > 0 ? Array.from(listOptions.services) : [],
		showHeader: listOptions.showHeader,
		showAccess: listOptions.showAccess,
		showPlatform: listOptions.showPlatform,
		showProduct: listOptions.showProduct,
		showNumber: listOptions.showNumber,
		countdown: listOptions.countdown,
		productFilter:
			listOptions.productFilter && listOptions.productFilter.size > 0 ? Array.from(listOptions.productFilter) : [],
		companyFilter:
			listOptions.companyFilter && listOptions.companyFilter.size > 0 ? Array.from(listOptions.companyFilter) : [],
		subtitle: listOptions.subtitle || '',
		subtitleParam: listOptions.subtitleParam || undefined,
		platformLocation: platformOptions.platformLocation || numberOptions.platformLocation || '',
		platformMode: platformOptions.platformMode || '',
		platformFilter: listOptions.platformFilter || '',
		numberIfNoTrains: numberOptions.numberIfNoTrains || undefined
	};

	const params = new URLSearchParams();
	for (const key of allowed) {
		const value = (allProps as any)[key];
		if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
			continue; // No añadir arrays vacíos ni valores vacíos
		}
		if (Array.isArray(value)) {
			params.append(key, value.join(','));
		} else {
			params.append(key, String(value));
		}
	}
	return params.toString();
}

const parseArray = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);
const parseBool = (v: string | null, def = false) => (v === null ? def : v === 'true' || v === '1');

export function urlParamsToData(params: URLSearchParams): PanelUrlParamsData {
	return {
		stationCode: params.get('stationCode') || '',
		interfaz: params.get('interfaz') || 'departures',
		traffic: parseArray(params.get('traffic')),
		languages: parseArray(params.get('languages')),
		showHeader: parseBool(params.get('showHeader'), true),
		showAccess: parseBool(params.get('showAccess'), true),
		showPlatform: parseBool(params.get('showPlatform'), true),
		showProduct: parseBool(params.get('showProduct'), true),
		showNumber: parseBool(params.get('showNumber'), true),
		countdown: parseBool(params.get('countdown'), false),
		productFilter: params.has('productFilter') ? parseArray(params.get('productFilter')) : [],
		companyFilter: params.has('companyFilter') ? parseArray(params.get('companyFilter')) : [],
		subtitle: params.get('subtitle') || '',
		subtitleParam: params.get('subtitleParam') || undefined,
		platformLocation: params.get('platformLocation') || '',
		platformMode: params.get('platformMode') || '',
		platformFilter: params.get('platformFilter') || '',
		fontSize: Number(params.get('fontSize')) || 1,
		numberIfNoTrains: params.get('numberIfNoTrains') || undefined,
		preview: parseBool(params.get('preview'), false)
	};
}

export function dataToGravitaProps(data: PanelUrlParamsData): Record<string, any> {
	const params: Record<string, any> = {
		rutaRecursos: '../../../recursos',
		IdEstacion: data.stationCode,
		languages: data.languages.join(','),
		'font-size': data.fontSize,
		interfaz: data.interfaz,
		traffic:
			data.traffic.length > 0
				? data.traffic
						.map(t => {
							switch (t) {
								case ServiceType.Cercanias:
									return 'C';
								case ServiceType.LargaDistancia:
									return 'L';
								case ServiceType.Regional:
									return 'R';
								case ServiceType.AltaVelocidad:
									return 'A';
								case ServiceType.ServicioInterno:
									return '-';
								default:
									return '';
							}
						})
						.filter(Boolean)
						.join(',')
				: '',
		'show-header': data.showHeader,
		'show-access': data.showAccess,
		'show-platform': data.showPlatform,
		'show-product': data.showProduct,
		'show-number': data.showNumber,
		countdown: data.countdown,
		'product-filter': data.productFilter.length > 0 ? data.productFilter.join(',') : undefined,
		'company-filter': data.companyFilter.length > 0 ? data.companyFilter.join(',') : undefined,
		subtitle: data.subtitleParam ? data.subtitle.replace(/\$$/, data.subtitleParam) : data.subtitle || undefined,
		'platform-location': data.platformLocation,
		'platform-mode': data.platformMode,
		'platform-filter': data.platformFilter || undefined,
		'number-if-no-trains': data.numberIfNoTrains || undefined
	};

	for (const key in params) {
		if (params[key] === undefined || params[key] === '' || (Array.isArray(params[key]) && params[key].length === 0)) {
			delete params[key];
		}
	}
	return params;
}

export function buildPanelUrlFromData({
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
	const params = dataToUrlParams({
		headerOptions,
		listOptions,
		platformOptions,
		numberOptions,
		fontSize
	});
	return `${PANEL_URL}?${params}`;
}
