let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let City = new Schema({
    title: String,
    collaborations: [{
        type: Schema.ObjectId, ref: 'Collaboration'
    }],
    organizations: [{
        type: Schema.ObjectId, ref: 'Organization'
    }]
});

City.methods.findSimilarTitle = function(cb) {
    return this.model('Cities').find({
        title: this.title
    }, cb);
};

City.index({
    title: 'text'
}, {
    weights: {
        title: 10
    },
    name: 'TextIndex'
});

let Cities = mongoose.model('Cities', City);

module.exports = Cities;