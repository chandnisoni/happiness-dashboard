var pg = require('pg');
var express = require('express');
var Twitter = require('twitter');
var Clarifai = require('clarifai');
var schedule = require('node-schedule');

var app = express();

// Load credentials from environment variables
var dbUrl = process.env.DATABASE_URL;
var clarifaiKey = process.env.clarifaiKey;
var clarifaiSecret = process.env.clarifaiSecret;
var twitterConsumerKey = process.env.twitterConsumerKey;
var twitterConsumerSecret = process.env.twitterConsumerSecret;
var twitterAccessTokenKey = process.env.twitterAccessTokenKey;
var twitterAccessTokenSecret = process.env.twitterAccessTokenSecret;

// Twitter Client for getting latest tweets.
var twitterClient = new Twitter({
  consumer_key: twitterConsumerKey,
  consumer_secret: twitterConsumerSecret,
  access_token_key: twitterAccessTokenKey,
  access_token_secret: twitterAccessTokenSecret
});

// Clarifai client for extracting concepts from images.
var clarifaiApp = new Clarifai.App(
  clarifaiKey,
  clarifaiSecret
);

// Submit the image to Clarifai, for learning about the concepts that are
// present inside the image.
function predict(imageUrl) {
  clarifaiApp.models.predict(Clarifai.GENERAL_MODEL, imageUrl).then(
    function(response) {
      console.log("Image: " + imageUrl);

      // If the response in not Ok, just return.
      if (response.status.description !== "Ok") {
        console.log("Invalid response");
        console.log(response);
        return;
      }

      for (var i = 0; i < response.outputs.length; i++) {
          var output = response.outputs[i];
          var concepts = output.data.concepts;
          if (concepts === undefined) {
            console.log("Invalid output");
            console.log(output);
            continue;
          }
          // Loop over all the concepts present in the image and
          // store them in the DB.
          for (var ci = 0; ci < concepts.length; ci++) {
            var concept = concepts[ci];
            storeInDB(concept);
          }
      }
    },
    function(err) {
      console.error(err);
    }
  );
}

// Increments the counter of concepts that are related to happniess.
var storeInDB = function(concept) {
  console.log(concept);
  var name = concept.name;
  var value = concept.value;
  // If the concept "name" is not present in the DB, then inserts a new record with
  // "count" intialized to 1.
  // Else if the concept "name" is already present in the DB, then increment the "count" column by 1.
  var sqlQuery = "INSERT INTO TAGS (name, count) values ('" + name + "', 1) ON CONFLICT (name) DO UPDATE SET count = TAGS.count + 1;"
  console.log("Running query: " + sqlQuery);
  pg.connect(dbUrl, function(err, pgClient, done) {
    pgClient.query(sqlQuery, function(err, result) {
      done();
      if (err)
       { console.error(err); }
      else
       { console.log(result.rows); }
    });
  });
}

// Driver function, which queries for tweets containing keyword "happy" and
// filter the ones which contains images.
var work = function() {
  twitterClient.get('search/tweets', {q: 'happy filter:images'}, function(error, tweets, response) {
    var statuses = tweets.statuses;
    for (var i = 0; i < statuses.length; i++) {
      var tweet = statuses[i];
      var entities = tweet.entities;
      var medias = entities.media;
      // If the tweet contains an image, then pass it onto Clarifai
      // to learn more about the concepts it contains.
      if (medias !== undefined) {
        for (var j = 0; j < medias.length; j++) {
          var media = medias[j];
          console.log(media.media_url);
          predict(media.media_url);
        }
      }
    }
  });
}

// Local debug
// work();
var rule = new schedule.RecurrenceRule();
rule.second = 2;
var job = schedule.scheduleJob(rule, function(){
  work();
});

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  // Whenever the dashboard is loaded, query the DB for the things that
  // internet is happy about.
  var sqlQuery = "SELECT * FROM TAGS ORDER BY count DESC LIMIT 25"
  pg.connect(dbUrl, function(err, pgClient, done) {
    pgClient.query(sqlQuery, function(err, result) {
      done();
      if (err) {
        console.error(err);
      } else {
        response.render('pages/index', {rows: result.rows});
      }
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

/**
TABLE SCHEMA:

CREATE TABLE TAGS(
  NAME  TEXT PRIMARY KEY     NOT NULL,
  COUNT INT     NOT NULL
);
*/
