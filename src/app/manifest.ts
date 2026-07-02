import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clocky - Shift Tracker',
    short_name: 'Clocky',
    description: 'Track your shifts and hours logged with ease.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#0A0A0A',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192 512x512',
        type: 'image/png',
      },
    ],
  }
}
