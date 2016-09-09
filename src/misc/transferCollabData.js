/*
** Transfer data from firebase to mongodb
*/

let async = require('async');
let mongoose = require ("mongoose");
let config = require('../config');

let Collaborations = require('./mongodb-models/collaboration.model');
let Scopes = require('./mongodb-models/scope.model');
let Types = require('./mongodb-models/type.model');
let Cities = require('./mongodb-models/city.model');
let States = require('./mongodb-models/state.model');

let firebase = config.getFirebase();
mongoose.connect(mongoConfig.getDbConnectionString());

let dataPath = 'collaborations/details';
let rootRef = firebase.database().ref(dataPath);

console.log("getting data...");
rootRef.once('value').then((snapshot) => {
    console.log("data retrieved!!");

    saveToMongoAsync(snapshot.val());
});

function saveToMongoAsync(data) {

    async.eachSeries(Object.keys(data), (collabId, nextCollab) => {

        let ready = {};
        let readyForNextCollab = (item) => {
            ready[item] = true;
            //console.log(item + " is ready...");
            if (ready["scope"] && ready["type"] && ready["location"]) {
                nextCollab();
            }
        };

        let newCollaboration = Collaborations({
            fbId: collabId,
            title: data[collabId].title,
            acronym: data[collabId].acronym,
            scope: data[collabId].scope,
            type: data[collabId].type,
            relativePath: data[collabId].relativePath,
            lastUpdated: data[collabId].lastUpdated,
            about: data[collabId].about,
            foundingDate: data[collabId].foundingDate,
            linkToFolderSites: data[collabId].linkToFolderSites,
            contactInfo: data[collabId].contactInfo,
            locations: data[collabId].locations,
            memberships: data[collabId].memberships,
            isActive: data[collabId].isActive,
            membershipFee: data[collabId].membershipFee,
            isNonProfit: data[collabId].isNonProfit,
            leadContacts: data[collabId].leadContacts
        });

        newCollaboration.save((err) => {

            console.log("Processing: " + collabId);

            if (err) {
                console.log("ERROR: " + err);
                throw err;
            }

            // Save Scopes
            async.eachSeries(Object.keys(data[collabId].scope), (scopeIndex, nextScope) => {
                let newScope = Scopes({
                    title: data[collabId].scope[scopeIndex]
                });

                //console.log("Adding scope: " + data[collabId].scope[scopeIndex]);

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
                if (err) throw err;
                readyForNextCollab("scope");
            });

            // Save Locations
            async.eachSeries(Object.keys(data[collabId].locations), (locationId, nextLocation) => {

                let ready = {};
                let readyForNextLocation = (item) => {
                    ready[item] = true;
                    //console.log("... " + item + " is ready...");
                    if (ready["city"] && ready["state"]) {
                        nextLocation();
                    }
                };

                let newCity = Cities({
                    title: data[collabId].locations[locationId].city
                });

                let newState = States({
                    title: data[collabId].locations[locationId].state
                });

                //console.log("Adding location: " + data[collabId].locations[locationId]);

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
                if (err) throw err;
                //console.log("Locations added successfully!");
                readyForNextCollab("location");
            });
            

            let newType = Types({
                title: data[collabId].type
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
                        if (err)
                            console.log("Error pushing collaboration to type: " + err);
                        
                        readyForNextCollab("type");
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
                            if (err)
                                console.log("Error pushing collaboration to type: " + err);
                            
                            readyForNextCollab("type");
                        });
                    });
                }
            });

        });
        

    }, (err) => {
        if (err) throw err;
        console.log("Iterating complete!");
    });


}
