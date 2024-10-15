'use strict';
const utf8 = require('utf8');
const express = require('express');
const cors = require('cors');
const { Pool, Client } = require('pg');
const axios = require('axios');
const jwt_decode = require('jwt-decode');
const jwt = require('jsonwebtoken');
// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

const statisticsHost = 'statisticsservice';
const loyaltyHost = 'loyaltyservice';
const paymentHost = 'paymentservice';
const reservationsHost = 'reservationservice';

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

// req.isAuthenticated is provided from the auth router

var client = new Client({
  user: 'postgres',//'program',
  host: '127.0.0.1',//'postgres',
  //database: 'reservations',
  password: 'postgres',//'test',
  port: 5432,
});

client.connect();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.listen(PORT, HOST);

console.log(`Running on http://${HOST}:${PORT}`);

app.use(cors({
  origin: 'http://localhost:3000',
}));

app.get('/', (req, res) => {
  res.send(req.oidc.isAuthenticated() ? 'Logged in: new' : 'Logged out: new')
});

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});

app.get('/check8070', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  axios.get(`http://${HOST}:8070/`, {})
    .then((response) => {
      // handle success
      res.statusCode = response.status
      response.status == 200 ? res.send(response.data) : res.end();
    })
    .catch((error) => {
      // handle error
      res.statusCode = 400
      res.end(JSON.stringify({ message: error.message }));
    })
});

app.get('/api/v1/statistics', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  axios.get(`http://${statisticsHost}:8090/api/v1/statistics`, req)
    .then((response) => {
      // handle success
      res.statusCode = response.status
      response.status == 200 ? res.send(response.data) : res.end();
    })
    .catch((error) => {
      // handle error
      res.statusCode = 400
      console.log("400 Error:");
      console.log(error);
      res.end(JSON.stringify({ message: error.message }));
    })
});

app.get('/manage/health', (req, res) => {
  res.statusCode = 200
  res.send(JSON.stringify({"Response" : "Good"}));
});

function parseJwt(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

app.get('/api/v1/hotels', (req, res) => {
  console.log("Hotels Log 01")
  if (req.headers && req.headers.authorization) {
    console.log("Hotels Log 02")
    var authorization = req.headers.authorization.split(' ')[1],
      decoded;
      console.log("Hotels Log 03")
    try {
      console.log("Hotels Log 04")
      console.log(authorization)
      decoded = parseJwt(authorization)
      console.log(decoded)
      console.log("Hotels Log 05")
      res.setHeader('Content-Type', 'application/json')
      axios.get(`http://${reservationsHost}:8070/api/v1/hotels`, {
        params: {
          page: req.query.page,
          size: req.query.size
        }
      })
        .then((response) => {
          console.log("Hotels Log 06")
          res.statusCode = response.status
          response.status == 200 ? res.send(response.data) : res.end(); res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out')
          console.log("Hotels Log 07")
        })
        .catch((error) => {
          console.log("Hotels Log 08")
          res.statusCode = 400
          console.log("/api/v1/hotels: ", res.statusCode)
          console.log("error message: ", error.message)
          console.log("error: ", error)
          res.end(JSON.stringify({ message: error.message }));
          console.log("Hotels Log 09")

        })
    } catch (e) {
      console.log("Hotels Log 10")
      console.log(e)
      res.status(401).send('unauthorized');
      console.log("Hotels Log 11")
    }
  }
  else {
    console.log("Hotels Log 12")
    res.status(401).send('unauthorized');
    console.log("Hotels Log 13")
  }

});

app.get('/api/v1/loyalty', (req, res) => {
  if (req.headers && req.headers.authorization) {
    var authorization = req.headers.authorization.split(' ')[1],
      decoded;
    try {
      console.log(authorization)
      decoded = parseJwt(authorization)
      console.log(decoded)

      res.setHeader('Content-Type', 'application/json')
      axios.get(`http://${loyaltyHost}:8050/api/v1/loyalty`, {
        params: {
          username: decoded["https://lab5/name"],
        }
      })
        .then((response) => {

          res.statusCode = response.status
          response.status == 200 ? res.send(response.data) : res.end();

        })
        .catch((error) => {

          res.statusCode = 400
          console.log("http://${HOST}:8050/api/v1/loyalty ", res.statusCode)
          console.log("error message: ", error.message)
          console.log("error: ", error)
          res.end(JSON.stringify({ message: error.message }));
        })

    } catch (e) {
      console.log(e)
      res.status(401).send('unauthorized');
    }
  }
  else {
    res.status(401).send('unauthorized');
  }

});

app.get('/api/v1/reservations/:reservationUid', (req, res) => {
  if (req.headers && req.headers.authorization) {
    var authorization = req.headers.authorization.split(' ')[1],
      decoded;
    try {
      console.log(authorization)
      decoded = parseJwt(authorization)
      console.log(decoded)

      res.setHeader('Content-Type', 'application/json')
      axios.get(`http://${reservationsHost}:8070/api/v1/reservations/${req.params.reservationUid}`, {
        params: {
          username: decoded["https://lab5/name"],
        }
      })
        .then((reservationResponse) => {
          // handle success
          axios.get(`http://${paymentHost}:8060/api/v1/payment`, {
            params: {
              paymentUid: reservationResponse.data.payment,
            }
          })
            .then((paymentResponse) => {
              // handle success
              var payment = paymentResponse.data[0]
              var reservation = reservationResponse.data
              delete payment.paymentuid
              reservation.payment = payment
              reservation.startDate = reservation.startDate.split("T")[0]
              reservation.endDate = reservation.endDate.split("T")[0]
              res.statusCode = 200
              res.send(JSON.stringify(reservation))

            })
            .catch((error) => {
              // handle error
              res.statusCode = 400
              console.log("http://${HOST}:8060/api/v1/payment: ", res.statusCode)
              console.log("error message: ", error.message)
              console.log("error: ", error)
              res.end(JSON.stringify({ message: error.message }));

            })
        })
        .catch((error) => {
          // handle error
          res.statusCode = 400
          console.log("http://${HOST}:8070/api/v1/reservations/${req.params.reservationUid}: ", res.statusCode)
          console.log("error message: ", error.message)
          console.log("error: ", error)
          res.end(JSON.stringify({ message: error.message }));

        })

    } catch (e) {
      console.log(e)
      res.status(401).send('unauthorized');
    }
  }
  else {
    res.status(401).send('unauthorized');
  }
});

app.get('/api/v1/reservations', (req, res) => {
  if (req.headers && req.headers.authorization) {
    var authorization = req.headers.authorization.split(' ')[1],
      decoded;
    try {
      console.log(authorization)
      decoded = parseJwt(authorization)
      console.log(decoded)

      res.setHeader('Content-Type', 'application/json')
      axios.get(`http://${reservationsHost}:8070/api/v1/reservations`, {
        params: {
          username: decoded["https://lab5/name"],
        }
      })
        .then((reservationResponse) => {
          // handle success
          console.log("reservationResponse.data.map", reservationResponse.data.map((val) => {
            return val.payment
          }).join(','))
          axios.get(`http://${paymentHost}:8060/api/v1/payments`, {
            params: {
              paymentUids: reservationResponse.data.map((val) => {
                return val.payment
              }).join(','),
            }
          })
            .then((paymentResponse) => {
              // handle success
              var payments = paymentResponse.data
              var reservations = reservationResponse.data
              reservations = reservations.map((val) => {
                var payment = payments.find(p => {
                  return p.paymentuid == val.payment
                })
                delete payment.paymentuid
                val.payment = payment
                val.startDate = val.startDate.split("T")[0]
                val.endDate = val.endDate.split("T")[0]
                return val
              })
              res.statusCode = 200
              res.send(JSON.stringify(reservations))

            })
            .catch((error) => {
              // handle error
              res.statusCode = 400
              console.log("http://${HOST}:8060/api/v1/payments: ", res.statusCode)
              console.log("error message: ", error.message)
              console.log("error: ", error)
              res.end(JSON.stringify({ message: error.message }));

            })
        })
        .catch((error) => {
          // handle error
          res.statusCode = 400
          console.log("/api/v1/reservations: ", res.statusCode)
          console.log("error message: ", error.message)
          console.log("error: ", error)
          res.end(JSON.stringify({ message: error.message }));

        })

    } catch (e) {
      console.log(e)
      res.status(401).send('unauthorized');
    }
  }
  else {
    res.status(401).send('unauthorized');
  }
});

app.get('/api/v1/me', (req, res) => {
  if (req.headers && req.headers.authorization) {
    var authorization = req.headers.authorization.split(' ')[1],
      decoded;
    try {
      console.log(authorization)
      decoded = parseJwt(authorization)
      console.log(decoded)

      res.setHeader('Content-Type', 'application/json')
      let loyaltyRequest = axios.get(`http://${loyaltyHost}:8050/api/v1/loyalty`, {
        params: {
          username: decoded["https://lab5/name"],
        }
      })
      let reservationRequest = axios.get(`http://${reservationsHost}:8080/api/v1/reservations`, {
        params: {
          username: decoded["https://lab5/name"],
        }
        /*
        headers: {
          'Authorization': req.headers.authorization,
        }
          */
      })

      axios.all([loyaltyRequest, reservationRequest]).then(axios.spread((...responses) => {
        const loyalty = responses[0]
        const reservations = responses[1]
        console.log(responses)
        res.send(JSON.stringify({ "loyalty": loyalty.data, "reservations": reservations.data }));

      })).catch(errors => {

        res.statusCode = 400
        console.log("/api/v1/me all: ", res.statusCode)
        console.log("error: ", errors)
        res.end(JSON.stringify(errors))

      })

    } catch (e) {
      console.log(e)
      res.status(401).send('unauthorized');
    }
  }
  else {
    res.status(401).send('unauthorized');
  }
});

app.post('/api/v1/reservations', (req, res) => {
  if (req.headers && req.headers.authorization) {
    var authorization = req.headers.authorization.split(' ')[1],
      decoded;
    try {
      console.log(authorization)
      decoded = parseJwt(authorization)
      console.log(decoded)

      res.setHeader('Content-Type', 'application/json')
      let date_1 = new Date(req.body.startDate);
      let date_2 = new Date(req.body.endDate);
      let difference = date_2.getTime() - date_1.getTime();
      let days = Math.ceil(difference / (1000 * 3600 * 24))
      let hotelRequest = axios.get(`http://${reservationsHost}:8070/api/v1/hotels/${req.body.hotelUid}`, {
        params: {
          username: decoded["https://lab5/name"],
        }
      })
      let avaibilityRequest = axios.get(`http://${reservationsHost}:8070/api/v1/avaibility`, {
        params: {
          username: decoded["https://lab5/name"],
          hotelUid: req.body.hotelUid,
          endDate: req.body.endDate,
          startDate: req.body.startDate
        }
      })

      let loyaltyRequest = axios.get(`http://${loyaltyHost}:8050/api/v1/loyalty`, {
        params: {
          username: decoded["https://lab5/name"],
        }
      })

      axios.all([hotelRequest, avaibilityRequest, loyaltyRequest]).then(axios.spread((...responses) => {
        const hotel = responses[0]
        const avaibility = responses[1]
        const loyalty = responses[2]
        console.log("avaibility", avaibility.data.available)
        if (avaibility.data.available) {
          console.log("payValues", hotel.data, days)
          pay(req, res, hotel.data, days, loyalty.data, decoded["https://lab5/name"])
        }
        else {
          res.statusCode = 201
          res.end();

        }
        // use/access the results 
      })).catch(errors => {

        res.statusCode = 400
        console.log("/api/v1/reservations all: ", res.statusCode)
        console.log("error: ", errors)
        res.end(JSON.stringify({
          "message": errors.message,
          "errors": errors
        }))

      })

    } catch (e) {
      console.log(e)
      res.status(401).send('unauthorized');
    }
  }
  else {
    res.status(401).send('unauthorized');
  }
});

app.delete('/api/v1/reservations/:reservationUid', (req, res) => {
  if (req.headers && req.headers.authorization) {
    var authorization = req.headers.authorization.split(' ')[1],
      decoded;
    try {
      console.log(authorization)
      decoded = parseJwt(authorization)
      console.log(decoded)

      res.setHeader('Content-Type', 'application/json')
      axios.delete(`http://${reservationsHost}:8070/api/v1/reservations/${req.params.reservationUid}`, {
        params: {
          username: decoded["https://lab5/name"]
        }
      })
        .then((reservationResponse) => {
          console.log("reservationResponse", reservationResponse)
          res.statusCode = 204
          res.send()

        })
        .catch((error) => {

          res.statusCode = 404
          console.log("http://${HOST}:8070/api/v1/reservations/${req.params.reservationUid}: ", res.statusCode)
          console.log("error message: ", error.message)
          console.log("error: ", error)
          res.end(JSON.stringify({ message: error.message }));

        })

    } catch (e) {
      console.log(e)
      res.status(401).send('unauthorized');
    }
  }
  else {
    res.status(401).send('unauthorized');
  }

});

function pay(req, res, hotel, days, loyalty, username) {
  axios.post(`http://${paymentHost}:8060/api/v1/pay`, null, {
    params: {
      price: ((hotel.price * days) - ((hotel.price * days) * loyalty.discount / 100))
    }
  })
    .then((payResponse) => {
      // handle success
      if (payResponse.status == 200) {
        console.log("payResponse", payResponse)
        reservation(req, res, payResponse.data.payment_uid, hotel, payResponse.data, loyalty, username)
      }
      else {
        console.log("payResponse", 201)
        res.statusCode = 201
        res.end();

      }
    })
    .catch((error) => {
      // handle error
      res.statusCode = 400
      console.log("http://${HOST}:8060/api/v1/pay: ", res.statusCode)
      console.log("error message: ", error.message)
      console.log("error: ", error)
      res.end(JSON.stringify({
        "message": error.message,
        "errors": error
      }))

    })
}

function reservation(req, res, paymentUid, hotel, payData, loyalty, username) {
  console.log("log-reservation: ", username)
  axios.post(`http://${reservationsHost}:8070/api/v1/reservations`, null, {
    params: {
      username: username,
      paymentUid: paymentUid,
      hotelId: hotel.id,
      status: payData.status,
      startDate: req.body.startDate,
      endDate: req.body.endDate
    }
  })
    .then((reservationResponse) => {
      // handle success
      console.log("log-reservation2: ", username)

      axios.post(`http://${loyaltyHost}:8050/api/v1/loyalty`, null, {
        params: {
          username: username
        }
      })
        .then((loyaltyResponse) => {
          // handle success
          console.log("reservationResponse", reservationResponse)
          res.statusCode = reservationResponse.status
          if (reservationResponse.status == 200) {
            delete payData.payment_uid
            var data = reservationResponse.data
            data["hotelUid"] = hotel.hotelUid
            data["startDate"] = data.startDate.split("T")[0]
            data["endDate"] = data.endDate.split("T")[0]
            data["payment"] = payData
            data["discount"] = loyalty.discount
            res.send(data)
          }
          else {
            res.end();
          }
        })
        .catch((error) => {
          // handle error

          res.statusCode = 400
          console.log("/api/v1/hotels: ", res.statusCode)
          console.log("error message: ", error.message)
          console.log("error: ", error)
          res.end(JSON.stringify({
            "message": error.message,
            "errors": error
          }))

        })
    })
    .catch((error) => {
      // handle error

      res.statusCode = 400
      console.log("http://${HOST}:8070/api/v1/reservations: ", res.statusCode)
      console.log("error message: ", error.message)
      console.log("error: ", error)
      res.end(JSON.stringify({
        "message": error.message,
        "errors": error
      }))

    })
}
