module.exports = {
  eslint: false,
  webpack: {
    configure: (webpackConfig) => {
      const sourceMapRule = webpackConfig.module.rules.find(
        (rule) => rule.loader && rule.loader.includes('source-map-loader'),
      );

      if (sourceMapRule) {
        const existingExcludes = Array.isArray(sourceMapRule.exclude)
          ? sourceMapRule.exclude
          : sourceMapRule.exclude
            ? [sourceMapRule.exclude]
            : [];
        sourceMapRule.exclude = [...existingExcludes, /node_modules[\\/]pdfmake[\\/]/];
      }

      return webpackConfig;
    },
  },
};
