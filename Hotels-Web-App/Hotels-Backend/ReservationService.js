
const { Kafka } = require('kafkajs');

'use strict';
const utf8 = require('utf8');
const uuid = require('uuid');
const axios = require('axios');
const express = require('express');
const { Pool, Client } = require('pg');
// Constants
const PORT = 8070;
const HOST = '0.0.0.0';
const statisticsHost = 'statisticsservice';

// App
const app = express();

var client = new Client({
  user: 'program',
  host: 'postgres',//'postgres.csiefghu5ckw.us-west-2.rds.amazonaws.com',//'postgres',
  database: 'reservations',
  password: 'test',
  port: 5432,
});

const kafka = new Kafka({
  clientId: 'RSOI-coursework',
  brokers: ['kafka:9092']  // Kafka broker address
});

const producer = kafka.producer();

// Connect Kafka producer when the app starts
(async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected');
  } catch (err) {
    console.error('Failed to connect Kafka producer:', err);
  }
})();

// Function to send Kafka message
const sendKafkaMessage = async (message) => {
  console.log("kafka detail: ")
  console.log(kafka)
  console.log("Kafka producer detail:")
  console.log(producer)
  try {
     await producer.send({
      topic: 'reservation-success',  // Topic where you want to send the message
      messages: [{ value: JSON.stringify(message) }]
    });
  } catch (err) {
    console.error("Failed to send Kafka message:", err);
  } 
};

client.connect();

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

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.listen(PORT, HOST);

console.log(`Running on http://${HOST}:${PORT}`);

init()

app.get('/', (req, res) => {
  res.send('Reservation Service');
});

app.get('/manage/health', (req, res) => {
  res.statusCode = 200
  res.send(JSON.stringify());
});

app.get('/api/v1/hotels', (req, res) => {
  console.log("Hotels Log I-01")
  renewClient()
  console.log("Hotels Log I-02")
  let querySQL = `
  SELECT id,
        hotel_uid as "hotelUid",
        name,
        country,
        city,
        address,
        stars,
        price 
  FROM hotels WHERE id > $1 AND id <= $2
`
  console.log("Hotels Log I-03")

  let first = req.query.size * (req.query.page - 1)
  let last = req.query.size * req.query.page
  let values = [first, last]
  console.log("Hotels Log I-04")
  console.log(client)
  client.query(querySQL, values, (err, result)=>{
    console.log("Hotels Log I-05")
    res.setHeader('Content-Type', 'application/json')
    if(!err){
      console.log("Hotels Log I-06")
      res.statusCode = 200
      res.send(JSON.stringify({
        "page": parseInt(req.query.page),
        "pageSize": parseInt(req.query.size),
        "totalElements": result.rowCount,
        "items": result.rows
      }));
      console.log("Hotels Log I-07")
    }
    else {
      console.log("Hotels Log I-08")
      res.statusCode = 404
      res.end(JSON.stringify({ message: err.message}));
      console.log("Hotels Log I-09")
    }
  });
  console.log("Hotels Log I-10")
});

app.delete('/api/v1/reservations/:reservationUid', (req, res) => {
  renewClient()
  let querySQL = `
    UPDATE reservation
    SET status = 'CANCELED'
    WHERE reservation_uid = $1 AND username = $2
`
  let values = [req.params.reservationUid, req.query.username]
  console.log("values", values)

  client.query(querySQL, values, (err, result)=>{
    res.setHeader('Content-Type', 'application/json')
    if(!err){
      res.statusCode = 204;
      console.log("kafka: message sended");
      sendKafkaMessage({message: 'cancelations'});
      res.end();
    }
    else {
      res.statusCode = 404
      res.end(JSON.stringify({ message: err.message}));
    }
  });
});

app.get('/api/v1/hotels/:hotelUid', (req, res) => {
  renewClient()
  let querySQL = `
  SELECT id,
        hotel_uid as "hotelUid",
        name,
        country,
        city,
        address,
        stars,
        price 
  FROM hotels WHERE hotel_uid = $1
`
  let values = [req.params.hotelUid]
  client.query(querySQL, values, (err, result)=>{
    res.setHeader('Content-Type', 'application/json')
    if(!err){
      res.statusCode = 200
      if (result.rowCount > 0) {
        res.send(JSON.stringify(result.rows[0]));
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
});


app.get('/api/v1/reservations', (req, res) => {
  renewClient()
  let querySQL = `
  SELECT 
          reservation.reservation_uid as "reservationUid",
          reservation.username,
          reservation.payment_uid as "paymentUid",
          reservation.hotel_id as "hotelId",
          hotels.hotel_uid as "hotelUid",
          hotels.name as "hotelName",
          hotels.country as "hotelCountry",
          hotels.city as "hotelCity",
          hotels.address as "hotelAddress",
          hotels.stars as "hotelStars",
          reservation.status as status,
          reservation.start_date as "startDate",
          reservation.end_data as "endData"
  FROM reservation
  INNER JOIN hotels ON reservation.hotel_id=hotels.id
  WHERE username = $1
`
  let values = [req.query.username]
  client.query(querySQL, values, (err, result)=>{
    res.setHeader('Content-Type', 'application/json')
    if(!err){
      res.statusCode = 200
        var reservations = result.rows.map((row) => {
          return {
            "reservationUid": row.reservationUid,
            "hotel": {
              "hotelUid": row.hotelUid,
              "name": row.hotelName,
              "fullAddress": `${row.hotelCountry}, ${row.hotelCity}, ${row.hotelAddress}`,
              "stars": row.hotelStars
            },
            "startDate": row.startDate,
            "endDate": row.endData,
            "status": row.status,
            "payment": row.paymentUid
          }
        })
      res.send(JSON.stringify(reservations));
    }
    else {
      res.statusCode = 404
      res.end(JSON.stringify({ message: err.message}));
    }
  });
});

app.get('/api/v1/avaibility', (req, res) => {
  renewClient()
  let querySQL = `
  SELECT 
          reservation.reservation_uid as reservationUid,
          reservation.username,
          reservation.payment_uid as paymentUid,
          reservation.hotel_id as hotelId,
          hotels.hotel_uid as hotelUid,
          hotels.name as hotelName,
          hotels.country as hotelCountry,
          hotels.city as hotelCity,
          hotels.address as hotelAddress,
          hotels.stars as hotelStars,
          reservation.status as status,
          reservation.start_date as startDate,
          reservation.end_data as endData
  FROM reservation
  INNER JOIN hotels ON reservation.hotel_id=hotels.id
  WHERE username = $1 AND hotels.hotel_uid = $2 AND reservation.start_date < $3 AND reservation.end_data > $4 AND reservation.status = $5
`
  let values = [req.query.username, req.query.hotelUid, req.query.endDate, req.query.startDate, "PAID"]
  client.query(querySQL, values, (err, result)=>{
    res.setHeader('Content-Type', 'application/json')
    if(!err){
      res.statusCode = 200
      res.send(JSON.stringify({available: result.rowCount == 0}));
    }
    else {
      res.statusCode = 404
      console.log(err.message)
      res.end(JSON.stringify({ message: err.message}));
    }
  });
});

app.get('/api/v1/reservations/:reservationUid', (req, res) => {
  renewClient()
  let querySQL = `
  SELECT 
          reservation.reservation_uid as "reservationUid",
          reservation.username,
          reservation.payment_uid as "paymentUid",
          reservation.hotel_id as "hotelId",
          hotels.hotel_uid as "hotelUid",
          hotels.name as "hotelName",
          hotels.country as "hotelCountry",
          hotels.city as "hotelCity",
          hotels.address as "hotelAddress",
          hotels.stars as "hotelStars",
          reservation.status as status,
          reservation.start_date as "startDate",
          reservation.end_data as "endData"
  FROM reservation
  INNER JOIN hotels ON reservation.hotel_id=hotels.id
  WHERE reservation.username = $1 AND reservation.reservation_uid = $2
`
  let values = [req.query.username, req.params.reservationUid]
  client.query(querySQL, values, (err, result)=>{
    res.setHeader('Content-Type', 'application/json')
    if(!err){
      res.statusCode = 200
      console.log("reservations",result.rows)
      var reservation = {}
      if (result.rowCount > 0) {
        var row = result.rows[0]
        reservation = {
          "reservationUid": row.reservationUid,
          "hotel": {
            "hotelUid": row.hotelUid,
            "name": row.hotelName,
            "fullAddress": `${row.hotelCountry}, ${row.hotelCity}, ${row.hotelAddress}`,
            "stars": row.hotelStars
          },
          "startDate": row.startDate,
          "endDate": row.endData,
          "status": row.status,
          "payment": row.paymentUid
        }
      }
      res.send(JSON.stringify(reservation));
    }
    else {
      res.statusCode = 404
      res.end(JSON.stringify({ message: err.message}));
    }
  });
});

app.post('/api/v1/reservations', (req, res) => {
  renewClient()
  let querySQL = `
  INSERT INTO reservation (reservation_uid, username, payment_uid, hotel_id, status, start_date, end_data)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING reservation_uid as "reservationUid", username, status, start_date as "startDate", end_data as "endDate"
`
  let values = [uuid.v4(), req.query.username, req.query.paymentUid, req.query.hotelId, req.query.status, req.query.startDate, req.query.endDate]
  
  client.query(querySQL, values, (err, result)=>{
    res.setHeader('Content-Type', 'application/json')
    if(!err){
      res.statusCode = 200
      if (result.rowCount > 0) {
        console.log("kafka: message sended")
        sendKafkaMessage({message: 'reservations'});
        res.send(JSON.stringify(result.rows[0]));
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
});

function init() {
  renewClient()
  let querySQL = `
  CREATE TABLE IF NOT EXISTS hotels
(
    id SERIAL PRIMARY KEY,
    hotel_uid uuid NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(80) NOT NULL,
    city VARCHAR(80) NOT NULL,
    address VARCHAR(255) NOT NULL,
    stars INT,
    price INT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservation
(
    id SERIAL PRIMARY KEY,
    reservation_uid uuid UNIQUE NOT NULL,
    username VARCHAR(80) NOT NULL,
    payment_uid uuid NOT NULL,
    hotel_id INT REFERENCES hotels (id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PAID', 'CANCELED')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_data TIMESTAMP WITH TIME ZONE
);
`

let queryInsert = `
INSERT INTO hotels (id, hotel_uid, name, country, city, address, stars, price) 
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO NOTHING;
`

  let values = [
    1, 
    "049161bb-badd-4fa8-9d90-87c9a82b0668", 
    "Ararat Park Hyatt Moscow",
    "Россия", 
    "Москва",
    "Неглинная ул., 4",
    5,
    10000
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
}

const consumer = kafka.consumer({ groupId: 'hotel-reservations-group' });

const run = async () => {  
  // Consumer: Connect and read messages
  await consumer.connect();
  await consumer.subscribe({ topic: 'reservation-success', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log("kafka: received!")
      console.log({
        value: message.value.toString(),
      });

      const obj = JSON.parse(message.value);

      console.log(obj.message)

      axios.post(`http://${statisticsHost}:8090/api/v1/statistics`, {name: obj.message})
      .then((response) => {
        // handle success
        console.log("GOOD:")
        console.log(response.status)
      })
      .catch((error) => {
        // handle error
        //res.statusCode = 400
        console.log("ERROR: 400")
        console.log(error.message)
        //res.end(JSON.stringify({ message: error.message }));
      })
    },
  });
};

run();


/*


app.get('/api/v1/hotels', (req, res) => {
  let querySQL = `
  SELECT hotel_uid as "hotelUid",
          name,
          country,
          city,
          address,
          stars,
          price 
  FROM hotels WHERE hotel_uid in $1
`
  let values = req.query.hotelIds.split(',')
  client.query(querySQL, values, (err, result)=>{
    res.setHeader('Content-Type', 'application/json')
    if(!err){
      res.statusCode = 200
      res.send(JSON.stringify(result.rows));
    }
    else {
      res.statusCode = 404
      res.end(JSON.stringify({ message: err.message}));
    }
  });
});

app.post('/api/v1/reservations/:reservationUid', (req, res) => {
  res.send('Gateway Service');
});
*/