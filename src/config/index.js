let mongoConfig = require('./mongodb-config');
let fbConfig = require('./firebase-config');

let firebase = require('firebase');
firebase.initializeApp(fbConfig);

module.exports = {
    getDbConnectionString: () => {
        return `mongodb://${mongoConfig.uname}:${mongoConfig.pwd}@${mongoConfig.path}`;
    },

    getFirebase: () => {
        return firebase;
    }
}