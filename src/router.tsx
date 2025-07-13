import { createBrowserRouter, Navigate } from 'react-router';

let router = createBrowserRouter([
	{
		path: '/',
		children: [
			{
				index: true,
				Component: () => <Navigate to="/configurator" />
			},
			{
				path: '/configurator',
				lazy: async () => ({
					Component: (await import('./pages/Configurator')).default
				})
			},
			{
				path: '/panel',
				lazy: async () => ({
					Component: (await import('./pages/Panel')).default
				})
			}
		]
	}
]);

export default router;
