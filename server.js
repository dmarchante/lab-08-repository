'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();

// API Routes
app.get('/location', (request, response) => {
  searchToLatLong(request.query.data)
    .then(location => response.send(location))
    .catch(error => handleError(error, response));
});

app.get('/weather', getWeather);
app.get('/events', getEvents);


// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// Error handler
function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('Sorry, something went wrong');
}

// Models
function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.body.results[0].formatted_address;
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
}

function Weather(day) {
  this.forecast = day.summary;
  this.time_of_day = new Date(day.time * 1000).toString().slice(0, 15);
}

function Event(event) {
  this.link = event.url;
  this.event_name = event.name.text;
  this.event_date = new Date(event.start.local).toString().slice(0, 15);
  this.summary = event.summary;
}

function searchToLatLong(query) {
  let sqlStatement = `SELECT * FROM location WHERE search_query = $1`;
  let values = [query];

  return client.query(sqlStatement, values)
    .then((data) => {
      if(data.rowCount > 0) {
        return data.rows[0];
      } else {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;

        return superagent.get(url)
          .then(res => {
            let newLocation = new Location(query, res);
            let insertStatement = `INSERT INTO location (search_query, formatted_query, latitude, longitude)  VALUES ($1, $2, $3, $4)`;
            let insertValues = [newLocation.latitude, newLocation.longitude, newLocation.formatted_query, newLocation.search_query];

            client.query(insertStatement, insertValues);

            return newLocation;
          })
          .catch(error => handleError(error));
      }
    });
}

function getWeather(request, response) {
  let sqlStatement = `SELECT * FROM weather WHERE forecast = $1`;

  return client.query(sqlStatement/*,whatgoeshere*/)
    .then(data => {
      if(data.rowCount > 0){
        return data.rows[0];
      } else {
        const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
        superagent.get(url)
        .then(result => {
          const weatherSummaries = result.body.daily.data.map(day => {
            return new Weather(day);
          });
          let insertStatement = `INSERT INTO weather (forecast, time_of_day)  VALUES ($1, $2)`;
          //let insertValues = [newWeather.forecast, newWeather.time_of_day];
          let insertValues = weatherSummaries.map(element =>{
            return [element.forecast, element.time_of_day];
          });

          for(let i = 0; i < insertValues.length; i++){
            client.query(insertStatement, insertValues[1]);
          }
          response.send(weatherSummaries);
          return weatherSummaries;
        })
        .catch(error => handleError(error, response));
      }
    });





function getEvents(request, response) {
  let sqlStatement = `SELECT * FROM events WHERE link = $1`;

  return client.query(sqlStatement,/*what goes here*/)
    .then(data=> {
      if (data.rows[0] > 0){
        return data.rows[0];
      }else{
        const url = `https://www.eventbriteapi.com/v3/events/search?token=${process.env.EVENTBRITE_API_KEY}&location.address=${request.query.data.formatted_query}`;
        superagent.get(url)
          .then(result => {
            const events = result.body.events.map(eventData => {
              const event = new Event(eventData);
              return event;
            });
      
            response.send(events);
          })
          .catch(error => handleError(error, response));
      }
    });
}