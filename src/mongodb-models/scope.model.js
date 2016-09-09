let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let Scope = new Schema({
    title: String,
    collaborations: [{
        type: Schema.ObjectId, ref: 'Collaboration'
    }],
    organizations: [{
        type: Schema.ObjectId, ref: 'Organization'
    }]
});

Scope.methods.findSimilarTitle = function(cb) {
    return this.model('Scopes').find({
        title: this.title
    }, cb);
};

Scope.index({
    title: 'text'
}, {
    weights: {
        title: 10
    },
    name: 'TextIndex'
});

let Scopes = mongoose.model('Scopes', Scope);

module.exports = Scopes;