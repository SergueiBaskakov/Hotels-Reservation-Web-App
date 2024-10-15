'use strict';
const utf8 = require('utf8');
const uuid = require('uuid');
const express = require('express');
const { Pool, Client } = require('pg');
// Constants
const PORT = 8090;
const HOST = '0.0.0.0';
// App
const app = express();

const { auth } = require('express-openid-connect');

const { requiresAuth } = require('express-openid-connect');

//Auth0 Config
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: '',
  baseURL: '',
  clientID: '',
  issuerBaseURL: ''
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

var client = new Client({
  user: 'program',
  host: 'postgres',//'postgres.csiefghu5ckw.us-west-2.rds.amazonaws.com',//'postgres',
  database: 'reservations',
  password: 'test',
  port: 5432,
});

client.connect();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.listen(PORT, HOST);

console.log(`Running on http://${HOST}:${PORT}`);

function parseJwt(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

init()

app.get('/', (req, res) => {
  res.send('Statistics Service');
});

app.get('/manage/health', (req, res) => {
  res.statusCode = 200
  res.send(JSON.stringify());
});

app.get('/api/v1/statistics', (req, res) => {
  console.log("/api/v1/statistics get")

  if (req.oidc.isAuthenticated()) {
    console.log("logged")

    if (req.headers && req.headers.authorization) {
      var authorization = req.headers.authorization.split(' ')[1],
        decoded;
      decoded = parseJwt(authorization);
      console.log("Statistics decoded:")
      console.log(decoded)
    }
  }

  if (req.headers && req.headers.authorization) {
    var authorization = req.headers.authorization.split(' ')[1],
      decoded;
    decoded = parseJwt(authorization);
    console.log("Statistics decoded:")
    console.log(decoded)
    console.log("authorization roles:")
    console.log(decoded['roles'])
    console.log(decoded['https://lab5/roles'])
    if (decoded['https://lab5/roles'].includes('Admin')) {
      renewClient()
  let querySQL = `
  SELECT name,
        number
  FROM statistics
`
      console.log(querySQL);
  client.query(querySQL, (err, result)=>{
    res.setHeader('Content-Type', 'application/json')
    if(!err){
      res.statusCode = 200
      if (result.rowCount > 0) {
        res.send(JSON.stringify(result.rows));
      }
      else {
        res.end()
      }
    }
    else {
      res.statusCode = 404
      res.end(JSON.stringify({ message: err.message}));
    }
  });
  console.log("sql error");
    }
    else {
      res.status(401).send('unauthorized');
    }
  }
  
});

app.post('/api/v1/statistics', (req, res) => {
  console.log("/api/v1/statistics post")
  renewClient()
  let querySQL = `
    UPDATE statistics
    SET number = number + 1
    WHERE name = $1;
`
  let values = [req.body.name]
  console.log("req", req)
  console.log("body", req.body)
  console.log("values", values)

  client.query(querySQL, values, (err, result)=>{
    res.setHeader('Content-Type', 'application/json')
    if(!err){
      res.statusCode = 204
      console.log("statistics updated successfull")
      res.end();
    }
    else {
      res.statusCode = 404
      console.log("statistics error on update")
      res.end(JSON.stringify({ message: err.message}));
    }
  });
});

function init() {
  let querySQL = `
  CREATE TABLE IF NOT EXISTS statistics
(
    name VARCHAR(255) NOT NULL UNIQUE,
    number INT NOT NULL
);
`

let queryInsert = `
INSERT INTO statistics (name, number) 
VALUES ($1, $2)
ON CONFLICT (name) DO NOTHING;
`

  let values = [
    "reservations",
    0
    ]

  client.query(querySQL, (err, result)=>{
    if(!err){
      console.log(result)
    }
    else {
      console.log(err.message)
    }
  })

  client.query(queryInsert, values, (err, result)=>{
    if(!err){
      console.log(result)
    }
    else {
      console.log(err.message)
    }
  })

  values = [
    "cancelations",
    0
    ]

  client.query(queryInsert, values, (err, result)=>{
    if(!err){
      console.log(result)
    }
    else {
      console.log(err.message)
    }
  })
}

function renewClient() {
  console.log("Renew Client Log 01")

  /*
  client = new Client({
    user: 'program',
    host: 'postgres.csiefghu5ckw.us-west-2.rds.amazonaws.com',//'postgres',
    database: 'reservations',
    password: 'test',
    port: 5432,
  });
  client.connect();
  */
}