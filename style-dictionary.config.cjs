module.exports = {
  source: ['design/tokens/tokens.json'],
  platforms: {
    scss: {
      transformGroup: 'scss',
      buildPath: 'apps/admin-web/src/styles/',
      files: [
        {
          destination: 'variables.scss',
          format: 'scss/variables'
        }
      ]
    },
    css: {
      transformGroup: 'css',
      buildPath: 'apps/admin-web/src/styles/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            selector: ':root'
          }
        }
      ]
    },
    js: {
      transformGroup: 'js',
      buildPath: 'apps/admin-web/src/styles/',
      files: [
        {
          destination: 'tokens.ts',
          format: 'javascript/es6',
          options: {
            moduleName: 'tokens'
          }
        }
      ]
    }
  }
};
