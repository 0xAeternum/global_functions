// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const serviceAccount = require('./serviceAccount.json');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const firebase = require('firebase-admin');
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://fir-test-c91f4.firebaseio.com"
});

// CORS Express middleware to enable CORS Requests.
const cors = require('cors')({
  origin: true,
});

function mode(arr){
  return arr.slice().sort((a,b) =>
        arr.filter(v => v===a).length
      - arr.filter(v => v===b).length
  ).pop();
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}


exports.mostVisitedFirstAttraction = functions.https.onRequest(async (req, res) => {
  let db = firebase.firestore();
  let allFirstAttractions = [];

  let attractionsRef = db.collection('users');
  attractionsRef.get().then(snapshot => {
    snapshot.forEach(doc => {
      allFirstAttractions.push(doc._fieldsProto.visitation_order.arrayValue.values[0].integerValue[0])
    })

    res.json({
      val: mode(allFirstAttractions)
    })
   
  }).catch(err => {
    console.log(err);
    res.json({
      error: err.message
    })
  });
});


exports.createMockDataUsers = functions.https.onRequest(async (req, res) => {
  let db = firebase.firestore();

  
  for (let i = 0; i < 15; i++) {
    db.collection(`users`).doc(`user number ${i}`).set({
      username: `username ${i}`,
      visitation_order: [getRandomInt(4), getRandomInt(4), getRandomInt(4), getRandomInt(4)]
    })
  }
  

  res.json({
    result: 'success'
  })
})

exports.createMockDataAttractions = functions.https.onRequest(async (req, res) => {
  let db = firebase.firestore();

  for (let i = 0; i < 15; i++) {
    db.collection('attraction').doc(`attraction number ${i}`).set({
      attr_id: i,
      title: `example attraction ${i}`,
      description: `example description for attraction ${i}`,
      position: new firebase.firestore.GeoPoint(i + 3, i + 1),
      direction: i + getRandomInt(15),
      active: true,
      created_at: Date.now(),
      updated_at: Date.now()
    })
  }

  res.json({
    result: 'success'
  })
})

exports.createdAtAttraction = functions.firestore.document('attraction/{attractionId}').onCreate((snap, context) => {
  return snap.ref.set({
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  }, {
    merge: true
    }).catch(err => {
      console.log(err)
      return false;
  })
})

exports.updatedAtAttraction = functions.firestore.document('attraction/{attractionId}').onUpdate((snap, context) => {
  return snap.ref.set({
    updated_at: firebase.firestore.FieldValue.serverTimestamp()
  }, {
    merge: true
    }).catch(err => {
      console.log(err)
      return false;
  })
})

exports.checkArea = functions.https.onRequest(async (req, res) => {
  return cors(req, res, () => {
    var classifyPoint = require("robust-point-in-polygon")

    var blueArea = [[52.9304, 6.7989], [52.9307, 6.7992], [52.9304, 6.7998], [52.9301, 6.7992]] // The boulder garden, BG
    
    var redArea = [[52.930076, 6.799321], [52.930596, 6.797672], [52.929933, 6.797294]] // hunebed d27, D27
    
    var purpleArea = [[52.931099, 6.797143], [52.931377, 6.797508], [52.931219, 6.797897], [52.930867, 6.797412]] // hundsdrug geopark expedition gateway, HGEG
    
    var yellowArea = [[52.931458, 6.797540], [52.931930, 6.798222], [52.930994, 6.801008], [52.930527, 6.800190]] // prehistoric park, PP
    
    var greenArea = [[52.930553, 6.799040], [52.931019, 6.798691], [52.930901, 6.798138], [52.930441, 6.798763]] // Hunebed Centrum, HC
    
    let place = findPlace(req.query.x, req.query.y)
    
    //res.status(200).send(place);

    res.json({
      result: place
    })

    function findPlace(x, y) {
      if (classifyPoint(redArea, [x, y]) != 1) {
        return 'D27';
      } else if (classifyPoint(blueArea, [x, y]) != 1) {
        return 'BG'
      } else if (classifyPoint(purpleArea, [x, y]) != 1) {
        return 'HGEG'
      } else if (classifyPoint(yellowArea, [x, y]) != 1) {
        return 'PP'
      } else if (classifyPoint(greenArea, [x, y]) != 1) {
        return 'HC'
      } else {
        return 'NONE'
      }
    }
  })
})