/*********************************************************************************
 * WEB422 – Assignment 01
 *
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 *
 * Name: Muhammad Ahmed
 * Student ID: 146908207
 * Date: 09-15-2022
 *
 * Cyclic Link: _______________________________________________________________
 ********************************************************************************/

const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const MoviesDB = require(path.join(__dirname, '/modules/moviesDB.js'));
const db = new MoviesDB();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

/* ----- SERVER ROUTES ----- */
// setup a 'route' to listen on the default/origin url path (http:/ / localhost/)
app.get('/', (req, res) => {
  res.json({ message: 'API Listening' });
});

/* 
This use() will not allow requests to go beyond it so we place it at the end of the file, after the other routes. This function will catch all other requests that don't match any other route handlers declared before it. This means we can use it as a sort of 'catch all' when no route match is found. We use this function to handle 404 requests to pages that are not found.
*/
app.use((req, res) => {
  res.status(404).send('not-found');
});

/* ----- CODE TO START THE SERVER ----- */
// initializing database cluster and checking for successful connection before starting the server
db.initialize(process.env.MONGODB_CONN_STRING)
  .then(() => {
    // setup http server to listen on HTTP_PORT
    app.listen(HTTP_PORT, () => {
      console.log(`server listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
