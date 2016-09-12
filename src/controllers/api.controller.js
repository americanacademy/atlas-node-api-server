let bodyParser = require('body-parser');
let db = require('./db.controller');

let defaultMaxResults = 10;

module.exports = setupAPI;

function setupAPI(app) {
    // Allow cross-origin requests
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    // Search API endpoint

    app.get('/api/v0/search', (req, res) => {
        console.log(JSON.stringify(req.query));

        let query = {
            queryString: req.query.q,
            queryType: req.query.qType,
            maxResults: req.query.maxResults > 0 ? req.query.maxResults : defaultMaxResults,
            page: req.query.page > 0 ? req.query.page : 1,
            pageCount: req.query.pageCount || false,
            categories: req.query.categories || [],
            states: req.query.states || []
        };

        db.searchFor(query, (err, results) => {
            if (err) {
                res.json(err);
                console.log(err);
            } else {
                res.json(results);
            }
        });
    });

    // Collaborations API endpoint

    app.get('/api/v0/collaboration', (req, res) => {

        // return all collaborations with page and maxResults options

        db.collaboration({
            maxResults: req.query.maxResults > 0 ? req.query.maxResults : defaultMaxResults,
            page: req.query.page > 0 ? req.query.page : 1,
            pageCount: req.query.pageCount || false
        }, (err, results) => {
            if (err) {
                res.json(err);
                console.log(err);
            } else {
                res.json(results);
            }
        });
    });

    app.get('/api/v0/collaboration/:id', (req, res) => {

        // return collaboration by fbId

        db.collaborationById(req.params.id, (err, results) => {
            if (err) {
                res.json(err);
                console.log(err);
            } else {
                res.json(results);
            }
        });
    });

    app.delete('/api/v0/collaboration/:id', (req, res) => {
        // if item is in firebase
            // delete from firebase
            // delete from mongodb

        db.deleteCollaboration(req.params.id, (err, result) => {
            if (err) {
                res.json(err);
                console.log(err);
            } else {
                res.json(results);
            }
        });
    });

    app.post('/api/v0/collaboration/:id', (req, res) => {
        // if item is in firebase
            // approve item in firebase
            // add item to mongodb

        db.updateCollaboration(req.params.id, (err, result) => {
            if (err) {
                res.json(err);
                console.log(err);
            } else {
                res.json(results);
            }
        });
    });
}