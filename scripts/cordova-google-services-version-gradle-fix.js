const fs = require('fs');
const path = require('path');

const FCM_VERSION = '15.0.0';

// You can include more of each string if there are naming conflicts,
// but for the GMS libraries each should be unique enough.
// The full list of libraries is here:
// https://developers.google.com/android/guides/setup
const LIBRARIES = [
  'play-services-maps',
  'play-services-location',
  'play-services-auth',
  'play-services-identity',
  'firebase-messaging',
];

const createRegex = (item) => new RegExp(`${item}:.*`, 'ig');
const createReplace = (item) => `${item}:${FCM_VERSION}`;

module.exports = (ctx) => {
  console.log('-----------------------------');
  console.log('> Gradle - fix `play-services` versions');

  const Q = ctx.requireCordovaModule('q');
  const deferred = Q.defer();

  const gradle = path.join(ctx.opts.projectRoot, 'platforms', 'android', 'project.properties');
  console.log(gradle);
  fs.readFile(gradle, 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      return deferred.reject(err);
    }

    let result = data;
    LIBRARIES.forEach((lib) => {
      result = result.replace(createRegex(lib), createReplace(lib));
    })

    return fs.writeFile(gradle, result, 'utf8', (err) => {
      if (err) {
        console.log('error');
        console.log('-----------------------------');
        deferred.reject(err);
      }
      console.log('completed');
      console.log('-----------------------------');
      deferred.resolve();
    });
  });

  return deferred.promise;
};