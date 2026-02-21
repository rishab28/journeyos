import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'JourneyOS',
        short_name: 'JourneyOS',
        description: 'A cognitive operating system for UPSC aspirants. Focus Feed, SRS Engine, and Rank 1 Predictions.',
        start_url: '/dashboard',
        display: 'standalone',
        background_color: '#0b0e17',
        theme_color: '#0b0e17',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
