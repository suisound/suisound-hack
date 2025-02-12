module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-flexbugs-fixes': {},
    'postcss-preset-env': {
      autoprefixer: {
        flexbox: 'no-2009'
      },
      stage: 3,
      features: {
        'custom-properties': false,
        'nesting-rules': false
      }
    },
    // Disable minification
    ...(process.env.NODE_ENV === 'production'
      ? {
          'cssnano': false
        }
      : {})
  }
} 