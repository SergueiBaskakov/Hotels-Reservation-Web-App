require('./GatewayService.js');
require('./LoyaltyService.js');
require('./PaymentService.js');
require('./ReservationService.js');
require('./StatisticsService.js');

/// docker-compose up -d --build
/// docker compose up -d --build

/*
kubectl delete deployment --all
kubectl delete service --all
kubectl delete ingress --all


kubectl apply -f zookeeper-deployment.yml
kubectl apply -f zookeeper-service.yml

kubectl apply -f kafka-deployment.yml
kubectl apply -f kafka-service.yml

kubectl apply -f postgres-deployment.yml
kubectl apply -f postgres-pvc.yml
kubectl apply -f postgres-service.yml

kubectl apply -f pgadmin-deployment.yml
kubectl apply -f pgadmin-service.yml

kubectl apply -f statisticsservice-deployment.yml
kubectl apply -f statisticsservice-service.yml

kubectl apply -f loyaltyservice-deployment.yml
kubectl apply -f loyaltyservice-service.yml

kubectl apply -f paymentservice-deployment.yml
kubectl apply -f paymentservice-service.yml

kubectl apply -f reservationservice-deployment.yml
kubectl apply -f reservationservice-service.yml

kubectl apply -f gatewayservice-deployment.yml
kubectl apply -f gatewayservice-service.yml

kubectl apply -f ingress.yml
kubectl apply -f ingress-class.yml




docker build -t your-image-name .
kubectl rollout restart deployment your-deployment


CREATE USER program WITH PASSWORD 'test';


kubectl exec -it postgres-6ccc75885-ttgxd -- psql -U postgres -d postgres

\dt


CREATE ROLE program WITH PASSWORD 'test';
ALTER ROLE program WITH LOGIN;

CREATE DATABASE payments;
GRANT ALL PRIVILEGES ON DATABASE payments TO program;

CREATE DATABASE reservations;
GRANT ALL PRIVILEGES ON DATABASE reservations TO program;

CREATE DATABASE loyalties;
GRANT ALL PRIVILEGES ON DATABASE loyalties TO program;


kubectl exec -it <postgres-pod-name> -- /bin/bash

CREATE TABLE IF NOT EXISTS statistics
(
    name VARCHAR(255) NOT NULL UNIQUE,
    number INT NOT NULL
);

INSERT INTO statistics (name, number) 
VALUES ('reservations', 0)
ON CONFLICT (name) DO NOTHING;

INSERT INTO statistics (name, number) 
VALUES ('cancelations', 0)
ON CONFLICT (name) DO NOTHING;

INSERT INTO loyalty (id, username, reservation_count, status, discount) 
VALUES (1, 'Test Max', 25, 'GOLD', 10)
    ON CONFLICT (id) DO NOTHING;






    kubectl get pods

    kubectl get ingress

    kubectl logs pod-name
*/

