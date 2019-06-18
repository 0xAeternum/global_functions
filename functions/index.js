// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
const serviceAccount = require('./serviceAccount.json');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const firebase = require('firebase-admin');
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://fir-test-c91f4.firebaseio.com"
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