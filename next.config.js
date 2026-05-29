/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
          remotePatterns: [
            { protocol: 'https', hostname: '**.supabase.co' },
            { protocol: 'https', hostname: '*.supabase.co' },
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'unsplash.com' },
            { protocol: 'https', hostname: '*.unsplash.com' },
            { protocol: 'https', hostname: 'placehold.co' },
            { protocol: 'https', hostname: 'picsum.photos' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'i.imgur.com' },
                ],
    },
    typescript: {
          ignoreBuildErrors: true,
    },
    eslint: {
          ignoreDuringBuilds: true,
    },
    // Disable filesystem cache in development to prevent "heap out of memory" crashes
    // caused by ever-growing webpack cache packs when compiling large admin pages.
    webpack: (config, { dev }) => {
        if (dev) {
            config.cache = false;
        }
        return config;
    },
};

module.exports = nextConfig;

