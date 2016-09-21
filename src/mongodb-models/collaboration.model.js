let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let Collaboration = new Schema({
    fbId: String,
    title: String,
    acronym: String,
    relativePath: String,
    scope: [String],
    lastUpdated: Number,
    about: String,
    type: String,
    foundingDate: String,
    linkToFolderSites: String,
    contactInfo: {
        website: String,
        twitter: String,
        facebook: String,
        youtubeVimeo: String
    },
    locations: [{
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    }],
    memberships: [{
        title: String,
        relativePath: String
    }],
    isActive: Boolean,
    membershipFee: {
        hasFee: Boolean,
        fee: String
    },
    isNonProfit: Boolean,
    leadContacts: [{
        name: String,
        contactLink: String
    }],
    additionalFields: [{
        title: String,
        value: String
    }]
});

Collaboration.index({
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

let Collaborations = mongoose.model('Collaborations', Collaboration);

module.exports = Collaborations;