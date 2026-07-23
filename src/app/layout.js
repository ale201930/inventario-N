import './globals.css';
import SWRegister from '@/components/SWRegister';
import CustomNotificationProvider from '@/components/CustomNotification';

export const metadata = {
  title: 'Sistema de Inventario y Ventas BCV',
  description: 'Gestión de inventario con fotografías, catálogo visual, ventas y tasa oficial BCV.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <SWRegister />
        <CustomNotificationProvider />
        {children}
      </body>
    </html>
  );
}
