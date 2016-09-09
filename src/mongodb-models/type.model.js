let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let Type = new Schema({
    title: String,
    collaborations: [{
        type: Schema.ObjectId, ref: 'Collaboration'
    }],
    organizations: [{
        type: Schema.ObjectId, ref: 'Organization'
    }]
});

Type.methods.findSimilarTitle = function(cb) {
    return this.model('Types').find({
        title: this.title
    }, cb);
};

Type.index({
    title: 'text'
}, {
    weights: {
        title: 10
    },
    name: 'TextIndex'
});

let Types = mongoose.model('Types', Type);

module.exports = Types;