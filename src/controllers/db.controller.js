let async = require('async');
let firebase = require('../config').getFirebase();

let fbRef = firebase.database().ref();
const FB_PATH = {
    collabs: {
        details: 'collaborations/details',
        deleteList: 'collaborations/deleteList',
        updateList: 'collaborations/updateList'    
    },
    orgs: {
        details: 'organizations/details',
        deleteList: 'organizations/deleteList',
        updateList: 'organizations/updateList'    
    }
};

let Collaborations = require('../mongodb-models/collaboration.model');
let Organizations = require('../mongodb-models/organization.model');
let States = require('../mongodb-models/state.model');
let Types = require('../mongodb-models/type.model');
let Scopes = require('../mongodb-models/scope.model');


module.exports = {
    searchFor: searchFilter,
    collaboration: getCollaboration,
    collaborationById: getCollaborationById,
    deleteCollaboration: deleteCollaborationById,
    updateCollaboration: updateCollaborationById
};

function getCollaboration(q, callback) {
    if (q.pageCount) {
        Collaborations
        .count({})
        .exec((err, results) => {
            if (err) {
                callback({
                    error: "Count collaborations error: " + err
                }, null);
            }

            callback(null, Math.ceil(results / q.maxResults));
        })
    } else {
        Collaborations
        .find({})
        .skip((q.page - 1) * q.maxResults).limit(q.maxResults).exec((err, results) => {
            if (err) {
                console.log("Error getting collaborations: " + err);
                callback(err, null);
            }

            callback(null, results);
        });
    }
}

function getCollaborationById(collabId, callback) {
    Collaborations
    .findOne({
        fbId: collabId
    }).exec((err, collaboration) => {
        if (err) {
            console.log("Error getting collaboration: " + err);
            callback(err, null);
        }

        callback(null, collaboration);
    });
}

function updateCollaborationById(collabId, callback) {
    fbRef.child(FB_PATH.collabs.updateList + '/' + collabId).once('value').then((snapshot) => {
		if (snapshot.val()) { // delete item
            
            // delete old reference
            deleteCollaborationById(collabId, (err, deleteResult) => {

                // update to firebase
                fbRef.child(FB_PATH.collabs.details + '/' + collabId).set(snapshot.val());
                fbRef.child(FB_PATH.collabs.updateList + '/' + collabId).remove();
                
                console.log("Updating: " + collabId);
                // updated in mongodb
                creatCollaboration(collabId, snapshot.val(), callback);
            });
            
        } else { // invalid access to delete
            console.log("Cannot update: " + collabId);
            callback({
                error: "Unauthorized permission."
            }, null);
        }
	});
}

function deleteCollaborationById(collabId, callback) {

    fbRef.child(FB_PATH.collabs.deleteList + '/' + collabId).once('value').then((snapshot) => {
		if (snapshot.val()) { // delete item

            // remove from firebase
            fbRef.child(FB_PATH.collabs.deleteList + '/' + collabId).remove();
            fbRef.child(FB_PATH.collabs.details + '/' + collabId).remove();

            Collaborations.findOne({
                fbId: collabId
            }).exec((err, result) => {
                if (err) {
                    console.log("Error deleting collaboration: " + err);
                    callback(err, null);
                }

                // remove collaboration._id from scope references
                if (result.scope) {
                    for (let i = 0; i < result.scope.length; i++) {
                        Scopes.update({
                            title: result.scope[i]
                        }, {
                            $pull: {
                                collaborations: {
                                    $in: [result._id]
                                }
                            }
                        });
                    }
                }

                // remove collaboration._id from city references
                if (result.locations) {
                    for (let i = 0; i < result.locations.length; i++) {
                        Cities.update({
                            title: result.locations[i].city
                        }, {
                            $pull: {
                                collaborations: {
                                    $in: [result._id]
                                }
                            }
                        });
                    }
                }

                // remove collaboration._id from state references
                if (result.locations) {
                    for (let i = 0; i < result.locations.length; i++) {
                        States.update({
                            title: result.locations[i].state
                        }, {
                            $pull: {
                                collaborations: {
                                    $in: [result._id]
                                }
                            }
                        });
                    }
                }

                // remove collaboration._id from type references
                if (result.type) {
                    Types.update({
                        title: result.type
                    }, {
                        $pull: {
                            collaborations: {
                                $in: [result._id]
                            }
                        }
                    });
                }

                // remove from collaborations
                Collaborations.findOne({ fbId: collabId }).remove();

                callback(null, "Delete successful!");
            });
        } else { // invalid access to delete
            callback({
                error: "Unauthorized permission."
            }, null);
        }
	});
}

function searchFilter(q, callback) {
    if (q.queryType === "collaborations" ||
        q.queryType === "collabs") {
        searchOrganizations(q, callback);
    } else if (q.queryType === "organizations" ||
                q.queryType === "orgs") {
        searchCollaborations(q, callback);
    } else {
        searchAll(q, callback);
    }
}

function searchAll(q, callback) {
    let results = [];
    async.waterfall([
        (next) => {
            searchOrganizations(q, next);
        }, (orgs, next) => {
            results.push(orgs); // add org results
            searchCollaborations(q, next);
        }, (collabs, next) => {
            results.push(collabs); // add collab results
            next(null);
        }
    ], (err) => {
        if (err) {
            console.log("Waterfall Error: " + err);
            callback(err, null);
        }

        // Flatten results
        results = [].concat.apply([], results);

        if (q.pageCount) {
            // Sum results and divide by number of results per page
            results = Math.ceil(( results[0] + results[1] ) / q.maxResults);
            callback(null, results);
        } else {
            // Sort results and remove
            results = results.sort((a, b) => {
                return b.score - a.score;
            }).slice(0, q.maxResults);

            callback(null, results);
        }

    })
}

function searchOrganizations(q, callback) {

    if (q.queryString) { // search by queryString
        if (q.pageCount) {
            Organizations.count({
                $text: {
                    $search: q.queryString
                }
            }).exec((err, results) => {
                if (err) {
                    callback({
                        error: "Count organizations error: " + err
                    }, null);
                }

                callback(null, results);
            })
        } else {
            Organizations.find({
                $text: {
                    $search: q.queryString
                }
            }).select({
                score: {
                    $meta: "textScore"
                }
            }).sort({
                score: {
                    $meta: "textScore"
                }
            }).skip((q.page - 1) * q.maxResults).limit(q.maxResults).exec((err, results) => {
                if (err) {
                    callback({
                        error: "Organization search error: " + err
                    }, null);
                }
                
                callback(null, results); // return results
            });
        }
    } else { // search All
        if (q.pageCount) {
            Organizations.count({}).exec((err, results) => {
                if (err) {
                    callback({
                        error: "Count organizations error: " + err
                    }, null);
                }

                callback(null, results);
            })
        } else {
            Organizations.find({}).sort({
                fbId: 1
            }).skip((q.page - 1) * q.maxResults).limit(q.maxResults).exec((err, results) => {
                if (err) {
                    callback({
                        error: "Organization search error: " + err
                    }, null);
                }
                
                callback(null, results); // return results
            });
        }
    }
}

function searchCollaborations(q, callback) {
    if (q.queryString) { // search by queryString
        if (q.pageCount) {
            Collaborations.count({
                $text: {
                    $search: q.queryString
                }
            }).exec((err, results) => {
                if (err) {
                    callback({
                        error: "Count collaborations error: " + err
                    }, null);
                }

                callback(null, results);
            })
        } else {
            Collaborations.find({
                $text: {
                    $search: q.queryString
                }
            }).select({
                score: {
                    $meta: "textScore"
                }
            }).sort({
                score: {
                    $meta: "textScore"
                }
            }).skip((q.page - 1) * q.maxResults).limit(q.maxResults).exec((err, results) => {
                if (err) {
                    callback({
                        error: "Collaborations search error: " + err
                    }, null);
                }
                
                callback(null, results); // return results
            });
        }
    } else { // search all
        if (q.pageCount) {
            Collaborations.count({}).exec((err, results) => {
                if (err) {
                    callback({
                        error: "Count collaborations error: " + err
                    }, null);
                }

                callback(null, results);
            })
        } else {
            Collaborations.find({}).sort({
                fbId: 1
            }).skip((q.page - 1) * q.maxResults).limit(q.maxResults).exec((err, results) => {
                if (err) {
                    callback({
                        error: "Collaborations search error: " + err
                    }, null);
                }
                
                callback(null, results); // return results
            });
        }
    }
}

function creatCollaboration(collabId, data, callback) {

    let newCollaboration = Collaborations({
        fbId: collabId,
        title: data.title,
        acronym: data.acronym,
        scope: data.scope || [],
        type: data.type || "",
        relativePath: data.relativePath,
        lastUpdated: data.lastUpdated,
        about: data.about,
        foundingDate: data.foundingDate,
        linkToFolderSites: data.linkToFolderSites,
        contactInfo: data.contactInfo || {},
        locations: data.locations || [],
        memberships: data.memberships || [],
        isActive: data.isActive,
        membershipFee: data.membershipFee || {},
        isNonProfit: data.isNonProfit,
        leadContacts: data.leadContacts || [],
        additionalFields: data.additionalFields || [{
            title: "",
            value: ""
        }]
    });

    newCollaboration.save((err) => {

        console.log("Processing: " + collabId);

        if (err) {
            console.log("ERROR: " + err);
            throw err;
        }

        // Save Scopes
        if (data.scope) {
            async.eachSeries(Object.keys(data.scope), (scopeIndex, nextScope) => {
                let newScope = Scopes({
                    title: data.scope[scopeIndex]
                });

                //console.log("Adding scope: " + data.scope[scopeIndex]);

                newScope.findSimilarTitle((err, scopes) => {
                    if (err) throw err;

                    if (scopes[0]) { // scopes already exist

                        Scopes.findByIdAndUpdate(scopes[0]._id, {
                            $push: {
                                "collaborations": newCollaboration._id
                            }
                        }, {
                            safe: true, upsert: true
                        }, (err, found) => {
                            if (err)
                                console.log("Error pusing collaborations to scope: " + err);

                            nextScope();
                        });
                    } else { // this is a new scope
                        newScope.save((err) => {
                            // Push collaboration to scope
                            Scopes.findByIdAndUpdate(newScope._id, {
                                $push: {
                                    "collaborations": newCollaboration._id
                                }
                            }, {
                                safe: true, upsert: true
                            }, (err, found) => {
                                if (err)
                                    console.log("Error pushing collaborations to scope: " + err);

                                nextScope();
                            });
                        });                     
                    }

                });
            }, (err) => {
                if (err) {
                    callback(err, null);
                }
            });
        }

        // Save Locations
        if (data.locations) {
            async.eachSeries(Object.keys(data.locations || []), (locationId, nextLocation) => {

                let ready = {};
                let readyForNextLocation = (item) => {
                    ready[item] = true;
                    //console.log("... " + item + " is ready...");
                    if (ready["city"] && ready["state"]) {
                        nextLocation();
                    }
                };

                let newCity = Cities({
                    title: data.locations[locationId].city
                });

                let newState = States({
                    title: data.locations[locationId].state
                });

                //console.log("Adding location: " + data.locations[locationId]);

                // Check if newCity exists
                newCity.findSimilarTitle((err, cities) => {
                    if (err) throw err;

                    if (cities[0]) { // old city
                        // push collabid to city

                        Cities.findByIdAndUpdate(cities[0]._id, {
                            $push: {
                                "collaborations": newCollaboration._id
                            }
                        }, {
                            safe: true, upsert: true
                        }, (err, found) => {
                            if (err)
                                console.log("Error pushing collaboration to city: " + err);
                            
                            readyForNextLocation("city");
                        });
                    } else { // new city

                        // push collabid to city
                        newCity.save((err) => {
                            // Push collaboration to scope
                            Cities.findByIdAndUpdate(newCity._id, {
                                $push: {
                                    "collaborations": newCollaboration._id
                                }
                            }, {
                                safe: true, upsert: true
                            }, (err, found) => {
                                if (err)
                                    console.log("Error pushing collaboration to city: " + err);
                                
                                readyForNextLocation("city");
                            });
                        });
                    }
                });

                newState.findSimilarTitle((err, states) => {
                    if (err) throw err;

                    if (states[0]) { // old city
                        // push collabid to city

                        States.findByIdAndUpdate(states[0]._id, {
                            $push: {
                                "collaborations": newCollaboration._id
                            }
                        }, {
                            safe: true, upsert: true
                        }, (err, found) => {
                            if (err)
                                console.log("Error pushing collaboration to state: " + err);
                            
                            readyForNextLocation("state");
                        });
                    } else { // new city

                        // push collabid to city
                        newState.save((err) => {
                            // Push collaboration to scope
                            States.findByIdAndUpdate(newState._id, {
                                $push: {
                                    "collaborations": newCollaboration._id
                                }
                            }, {
                                safe: true, upsert: true
                            }, (err, found) => {
                                if (err)
                                    console.log("Error pushing collaboration to state: " + err);
                                
                                readyForNextLocation("state");
                            });
                        });
                    }
                });
                
            }, (err) => {
                if (err) {
                    callback(err, null);
                }
            });
        }
        
        if (data.type) {
            let newType = Types({
                title: data.type
            });

            newType.findSimilarTitle((err, types) => {
                if (err) throw err;

                if (types[0]) {
                    Types.findByIdAndUpdate(types[0]._id, {
                        $push: {
                            "collaborations": newCollaboration._id
                        }
                    }, {
                        safe: true, upsert: true
                    }, (err, found) => {
                        if (err) {
                            callback(err, null);
                        }
                        
                    });
                } else {
                    newType.save((err) => {
                        // Push collaboration to type
                        States.findByIdAndUpdate(newType._id, {
                            $push: {
                                "collaborations": newCollaboration._id
                            }
                        }, {
                            safe: true, upsert: true
                        }, (err, found) => {
                            if (err) {
                                callback(err, null);
                            }
                        });
                    });
                }
            });
        }

    });

    callback(null, "Successfully created/updated!");
}