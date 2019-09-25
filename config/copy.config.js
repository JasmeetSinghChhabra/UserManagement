// New copy task for font files
module.exports = {
  copyFontAwesome: {
    src: ['{{ROOT}}/node_modules/font-awesome/fonts/**/*'],
    dest: '{{WWW}}/assets/fonts'
  },
  copyOpenTok: {
    src: ['{{ROOT}}/scripts/opentok/*.js'],
    dest: '{{WWW}}/build'
  }
};

if (process.env.IONIC_ENV === 'prod') {
  process.env.IONIC_GENERATE_SOURCE_MAP = false;
  process.env.IONIC_SOURCE_MAP_TYPE = 'source-map';
}