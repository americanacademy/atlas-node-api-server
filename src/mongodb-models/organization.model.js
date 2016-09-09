let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let Organization = new Schema({
    fbId: String,
    title: String,
    relativePath: String,
    scope: [String],
    lastUpdated: Number,
    about: String,
    type: String,
    foundingDate: String,
    linkToFolderSites: String,
    ContactInfo: {
        website: String,
        twitter: String,
        facebook: String,
        youtubeVimeo: String,
        linkedInCompanyPage: String,
        linkedInGroupsOrAccounts: String
    },
    locations: [{
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    }],
    collaborations: [{
        title: String,
        relativePath: String
    }],
    isActive: Boolean,
    nonProfitStatus: Boolean,
    lobby: String
});

Organization.index({
    title: 'text',
    about: 'text',
    scope: 'text',
    type: 'text'
}, {
    weights: {
        title: 10,
        about: 6,
        scope: 2,
        type: 1
    },
    name: 'TextIndex'
});

let Organizations = mongoose.model('Organizations', Organization);

module.exports = Organizations;