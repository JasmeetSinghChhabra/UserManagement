var path = require('path');
module.exports = function(context) {
    var shell = context.requireCordovaModule('shelljs');
    var src = path.join(context.opts.projectRoot, 'scripts/android/build-extras.gradle');
    var dest = path.join(context.opts.projectRoot, 'platforms/android/app');
    shell.cp('-fr', src, dest);
  };