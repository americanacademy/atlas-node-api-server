/*
** Transfer data from firebase to mongodb
*/

let async = require('async');
let firebase = require('firebase');
let mongoose = require ("mongoose");
let mongoConfig = require('./mongodb-config');

let Organizations = require('./mongodb-models/organization.model');
let Scopes = require('./mongodb-models/scope.model');
let Types = require('./mongodb-models/type.model');
let Cities = require('./mongodb-models/city.model');
let States = require('./mongodb-models/state.model');


let config = {
  apiKey: "AIzaSyCrjZXXm3VpFICa6OBte4NDFa0yo4ZMq0U",
  authDomain: "science-policy-atlas.firebaseapp.com",
  databaseURL: "https://science-policy-atlas.firebaseio.com"
};

firebase.initializeApp(config);
mongoose.connect(mongoConfig.getDbConnectionString());

let dataPath = 'organizations/details';
let rootRef = firebase.database().ref(dataPath);

console.log("getting data...");
rootRef.once('value').then((snapshot) => {
    console.log("data retrieved!!");

    saveToMongoAsync(snapshot.val());
    
});

function saveToMongoAsync(data) {

    async.eachSeries(Object.keys(data), (orgId, nextOrg) => {

        let ready = {};
        let readyForNextOrg = (item) => {
            ready[item] = true;
            //console.log(item + " is ready...");
            if (ready["scope"] && ready["type"] && ready["location"]) {
                nextOrg();
            }
        };

        let newOrganization = Organizations({
            fbId: orgId,
            title: data[orgId].title,
            scope: data[orgId].scope,
            type: data[orgId].type,
            relativePath: data[orgId].relativePath,
            lastUpdated: data[orgId].lastUpdated,
            about: data[orgId].about,
            foundingDate: data[orgId].foundingDate,
            linkToFolderSites: data[orgId].linkToFolderSites,
            contactInfo: data[orgId].contactInfo,
            locations: data[orgId].locations,
            collaborations: data[orgId].collaborations,
            isActive: data[orgId].isActive,
            nonProfitStatus: data[orgId].nonProfitStatus,
            lobby: data[orgId].lobby
        });

        newOrganization.save((err) => {

            console.log("Processing: " + orgId);

            if (err) {
                console.log("ERROR: " + err);
                throw err;
            }

            // Save Scopes
            if (data[orgId].scope) {
                async.eachSeries(Object.keys(data[orgId].scope), (scopeIndex, nextScope) => {
                    let newScope = Scopes({
                        title: data[orgId].scope[scopeIndex]
                    });

                    //console.log("Adding scope: " + data[orgId].scope[scopeIndex]);

                    newScope.findSimilarTitle((err, scopes) => {
                        if (err) {
                            console.log("ERROR: " + err);
                            throw err;
                        }

                        if (scopes[0]) { // scopes already exist
                            //console.log("Scopes: " + JSON.stringify(scopes[0]));

                            Scopes.findByIdAndUpdate(scopes[0]._id, {
                                $push: {
                                    "organizations": newOrganization._id
                                }
                            }, {
                                safe: true, upsert: true
                            }, (err, found) => {
                                if (err)
                                    console.log("Error pusing organizations to scope: " + err);

                                nextScope();
                            });
                        } else { // this is a new scope
                            newScope.save((err) => {
                                if (err) {
                                    console.log("ERROR: " + err);
                                    throw err;
                                }
                                // Push organization to scope
                                Scopes.findByIdAndUpdate(newScope._id, {
                                    $push: {
                                        "organizations": newOrganization._id
                                    }
                                }, {
                                    safe: true, upsert: true
                                }, (err, found) => {
                                    if (err)
                                        console.log("Error pushing organizations to scope: " + err);

                                    nextScope();
                                });
                            });                     
                        }

                    });
                }, (err) => {
                    if (err) {
                        console.log("ERROR: " + err);
                        throw err;
                    }
                    //console.log("Scopes added successfully!");
                    readyForNextOrg("scope");
                });
            } else {
                readyForNextOrg("scope");
            }

            // Save Locations
            if (data[orgId].locations) {
                async.eachSeries(Object.keys(data[orgId].locations), (locationId, nextLocation) => {

                    let ready = {};
                    let readyForNextLocation = (item) => {
                        ready[item] = true;
                        //console.log("... " + item + " is ready...");
                        if (ready["city"] && ready["state"]) {
                            nextLocation();
                        }
                    };

                    let newCity = Cities({
                        title: data[orgId].locations[locationId].city
                    });

                    let newState = States({
                        title: data[orgId].locations[locationId].state
                    });

                    // console.log("Adding location: " + data[orgId].locations[locationId]);

                    // Check if newCity exists
                    newCity.findSimilarTitle((err, cities) => {
                        if (err) {
                            console.log("ERROR: " + err);
                            throw err;
                        }

                        if (cities[0]) { // old city
                            // push collabid to city

                            Cities.findByIdAndUpdate(cities[0]._id, {
                                $push: {
                                    "organizations": newOrganization._id
                                }
                            }, {
                                safe: true, upsert: true
                            }, (err, found) => {
                                if (err)
                                    console.log("Error pushing organization to city: " + err);
                                
                                readyForNextLocation("city");
                            });
                        } else { // new city

                            // push collabid to city
                            newCity.save((err) => {
                                // Push organization to scope
                                Cities.findByIdAndUpdate(newCity._id, {
                                    $push: {
                                        "organizations": newOrganization._id
                                    }
                                }, {
                                    safe: true, upsert: true
                                }, (err, found) => {
                                    if (err)
                                        console.log("Error pushing organization to city: " + err);
                                    
                                    readyForNextLocation("city");
                                });
                            });
                        }
                    });

                    newState.findSimilarTitle((err, states) => {
                        if (err) {
                            console.log("ERROR: " + err);
                            throw err;
                        }

                        if (states[0]) { // old city
                            // push collabid to city

                            States.findByIdAndUpdate(states[0]._id, {
                                $push: {
                                    "organizations": newOrganization._id
                                }
                            }, {
                                safe: true, upsert: true
                            }, (err, found) => {
                                if (err)
                                    console.log("Error pushing organization to state: " + err);
                                
                                readyForNextLocation("state");
                            });
                        } else { // new city

                            // push collabid to city
                            newState.save((err) => {
                                // Push organization to scope
                                States.findByIdAndUpdate(newState._id, {
                                    $push: {
                                        "organizations": newOrganization._id
                                    }
                                }, {
                                    safe: true, upsert: true
                                }, (err, found) => {
                                    if (err)
                                        console.log("Error pushing organization to state: " + err);
                                    
                                    readyForNextLocation("state");
                                });
                            });
                        }
                    });
                    
                }, (err) => {
                    if (err) throw err;
                    //console.log("Locations added successfully!");
                    readyForNextOrg("location");
                });
            } else {
                readyForNextOrg("location");
            }

            let newType = Types({
                title: data[orgId].type
            });

            newType.findSimilarTitle((err, types) => {
                if (err) throw err;

                if (types[0]) {
                    Types.findByIdAndUpdate(types[0]._id, {
                        $push: {
                            "organizations": newOrganization._id
                        }
                    }, {
                        safe: true, upsert: true
                    }, (err, found) => {
                        if (err)
                            console.log("Error pushing organization to type: " + err);
                        
                        readyForNextOrg("type");
                    });
                } else {
                    newType.save((err) => {
                        // Push organization to type
                        States.findByIdAndUpdate(newType._id, {
                            $push: {
                                "organizations": newOrganization._id
                            }
                        }, {
                            safe: true, upsert: true
                        }, (err, found) => {
                            if (err)
                                console.log("Error pushing organization to type: " + err);
                            
                            readyForNextOrg("type");
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
