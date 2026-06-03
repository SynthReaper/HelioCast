/**
 * © 2026 HelioCast Systems | Developed by SynthReaper
 * GitHub: https://github.com/SynthReaper/HelioCast
 */
import './globals.css';

export const metadata = {
  title: 'HelioCast 🌟 — Real-time Space Weather Dashboard',
  description: 'HelioCast brings real-time Space Weather analytics, geomagnetic storm tracking, solar flares, and aurora forecasts to your browser.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="stars-bg"></div>
        <div className="nebula-bg"></div>
        {children}
      </body>
    </html>
  );
}
