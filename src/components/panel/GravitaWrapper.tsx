import { useEffect, useRef, useState, useMemo } from 'react';
import * as signalR from '@microsoft/signalr';
import logoAdif from '../../assets/logo-adif.webp';
import { dataToGravitaProps, isDefaultInterfaz, type PanelUrlParamsData } from '@/lib/props';
import { Loader2Icon, TrainTrackIcon } from 'lucide-react';
import { ADIF_GRAVITA_ROOT, GRAVITA_ROOT } from '@/constants';

type Props = PanelUrlParamsData & {
	onData?: (data: any) => void;
	onStatus?: (status: string) => void;
};

const GravitaWrapper = (props: Props) => {
	const { stationCode, onData, onStatus, ...restProps } = props;

	const [status, setStatus] = useState<string>('connecting');
	const [loading, setLoading] = useState<boolean>(true);
	const lastMessageRaw = useRef<string | null>(null);
	const connection = useRef<signalR.HubConnection | null>(null);
	const boardRef = useRef<HTMLIFrameElement | null>(null);

	// Solo props primitivas y no funciones, en kebab-case
	const iframeSrc = useMemo(() => {
		if (!stationCode) return '';
		const gravitaParamsObj = dataToGravitaProps(props);
		const gravitaParams = new URLSearchParams({
			rutaRecursos: '../../../recursos',
			IdEstacion: stationCode,
			...gravitaParamsObj
		});
		const url = `${
			isDefaultInterfaz(gravitaParamsObj.interfaz) ? ADIF_GRAVITA_ROOT : GRAVITA_ROOT
		}/gravita.html?${gravitaParams.toString()}`;
		return url;
	}, [stationCode, restProps]);

	const sendBoardData = (msg: string) => {
		boardRef.current?.contentWindow?.postMessage({ target: 'grvta.setData', objData: msg }, '*');
		setTimeout(() => {
			setLoading(false);
		}, 1000);
	};

	const handleIncoming = (raw: string) => {
		lastMessageRaw.current = raw;
		sendBoardData(raw);
		onData && onData(JSON.parse(raw));
		console.log('[SignalR] Received message:', JSON.parse(raw));
	};

	const handleBoardLoad = () => {
		if (lastMessageRaw.current) {
			setTimeout(() => {
				sendBoardData(lastMessageRaw.current!);
			}, 300);
		}
	};

	// Conexión inicial y limpieza
	useEffect(() => {
		if (!stationCode) return;
		const conn = new signalR.HubConnectionBuilder()
			.withUrl('https://info.adif.es/InfoStation', {
				skipNegotiation: true,
				transport: signalR.HttpTransportType.WebSockets
			})
			.configureLogging(signalR.LogLevel.Error)
			.withAutomaticReconnect()
			.build();
		connection.current = conn;

		conn.on('ReceiveMessage', handleIncoming);
		conn.on('ReceiveError', (error: any) => {
			console.error('[SignalR] ReceiveError:', error);
		});

		const startConnection = async () => {
			try {
				await conn.start();
				await conn.invoke('JoinInfo', `ECM-${stationCode}`);
				await conn.invoke('GetLastMessage', `ECM-${stationCode}`);
				setStatus('online');
			} catch (err) {
				console.error('[SignalR] Error:', err);
				setStatus('error');
			}
		};

		startConnection();

		return () => {
			conn.stop();
			connection.current = null;
			setStatus('disconnected');
		};
	}, [stationCode]);

	// Notificar cambios de status
	useEffect(() => {
		onStatus && onStatus(status);
	}, [status, onStatus]);

	return (
		<div className="relative flex-1 flex flex-col">
			{!!loading && (
				<div className="absolute inset-0 flex flex-col gap-8 items-center justify-center bg-background z-50">
					{props.preview ? (
						<TrainTrackIcon className="text-primary md:w-32 w-24 md:h-32 h-24" />
					) : (
						<div
							className={'bg-primary md:w-64 w-48'}
							style={{
								WebkitMask: `url(${logoAdif}) center/contain no-repeat`,
								mask: `url(${logoAdif}) center/contain no-repeat`
							}}
						>
							<img src={logoAdif} alt="ADIF Logo" className="w-full h-full object-cover opacity-0" />
						</div>
					)}
					<Loader2Icon className="animate-spin text-primary h-8 w-8" />
				</div>
			)}

			<iframe
				ref={boardRef}
				src={iframeSrc}
				onLoad={handleBoardLoad}
				title="Gravita Board"
				className="relative w-full flex-1 border-none cursor-none z-20"
			/>
		</div>
	);
};

export default GravitaWrapper;
