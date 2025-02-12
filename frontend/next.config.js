const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['three'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'three': path.resolve('./node_modules/three')
    };

    // Handle CSS differently
    config.module.rules.forEach((rule) => {
      if (rule.oneOf) {
        rule.oneOf.forEach((one) => {
          if (one.sideEffects === false) {
            one.sideEffects = true;
          }
        });
      }
    });

    // Add custom CSS handling
    config.module.rules.push({
      test: /\.css$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1,
            modules: false
          }
        },
        'postcss-loader'
      ]
    });

    return config;
  },
  optimizeFonts: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    // Use a different CSS minifier
    optimizeCss: true,
    cssMinifier: 'csso'
  }
}

module.exports = nextConfig 