let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let State = new Schema({
    title: String,
    collaborations: [{
        type: Schema.ObjectId, ref: 'Collaboration'
    }],
    organizations: [{
        type: Schema.ObjectId, ref: 'Organization'
    }]
});

State.methods.findSimilarTitle = function(cb) {
    return this.model('States').find({
        title: this.title
    }, cb);
};

State.index({
    title: 'text'
}, {
    weights: {
        title: 10
    },
    name: 'TextIndex'
});

let States = mongoose.model('States', State);

module.exports = States;