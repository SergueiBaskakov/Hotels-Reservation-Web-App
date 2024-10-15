# Hotels Reservation Web App

## Description
This repository contains the backend and the frontend of an hotel reservations web application created as part of the "Distributed Information Processing Systems" master's course.

## Backend
The backend was developed using: 
- Node.js
- Kafka
- PostgreSQL
- Auth0
- Docker
- Kubernetes

### Deployment
To deploy the backend you will need to fill the Auth0 configuration in the StatisticsService.js and GatewayService.js files:

  const config = {
    authRequired: false,
    auth0Logout: true,
    secret: '',
    baseURL: '',
    clientID: '',
    issuerBaseURL: ''
  };

## Frontend
The frontend was developed using:
- React
- Docker


