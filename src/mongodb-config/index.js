let config = require('./config');

module.exports = {
    getDbConnectionString: () => {
        return `mongodb://${config.uname}:${config.pwd}@ds019956.mlab.com:19956/science-policy-atlas-test2`
    }
}