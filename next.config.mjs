/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Add webpack configuration to handle FFmpeg properly
    webpack: (config, { isServer }) => {
        // Don't bundle FFmpeg on the server side
        if (isServer) {
            config.externals = config.externals || [];
            config.externals.push('@ffmpeg/ffmpeg', '@ffmpeg/util');
        }

        // Configure FFmpeg for client side
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
            };
        }

        return config;
    },
    images: {
        unoptimized: true,
        domains: [
            'image.pollinations.ai',
            'via.placeholder.com',
            'source.unsplash.com',
            'images.pexels.com',
            'placeholder.com',
            'picsum.photos',
        ],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

export default nextConfig;
