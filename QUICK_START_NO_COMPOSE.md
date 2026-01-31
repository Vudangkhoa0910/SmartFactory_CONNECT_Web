# HUONG DAN CHAY HE THONG KHONG DUNG DOCKER-COMPOSE

## BUOC 1: TAO NETWORK VA VOLUMES

```powershell
docker network create smartfactory_network
docker volume create smartfactory_postgres_data
docker volume create smartfactory_mongodb_data
docker volume create smartfactory_uploads
```

## BUOC 2: KHOI DONG POSTGRESQL

```powershell
docker run -d --name smartfactory_database --network smartfactory_network -e POSTGRES_DB=smartfactory_db -e POSTGRES_USER=smartfactory -e POSTGRES_PASSWORD=smartfactory123 -v smartfactory_postgres_data:/var/lib/postgresql/data -p 0.0.0.0:5432:5432 pgvector/pgvector:pg15
```

## BUOC 3: KHOI DONG MONGODB

```powershell
docker run -d --name smartfactory_mongodb --network smartfactory_network -e MONGO_INITDB_ROOT_USERNAME=smartfactory -e MONGO_INITDB_ROOT_PASSWORD=smartfactory123 -v smartfactory_mongodb_data:/data/db -p 0.0.0.0:27017:27017 mongo:7.0
```

## BUOC 4: DOI 30 GIAY

```powershell
Start-Sleep -Seconds 30
```

## BUOC 5: KHOI DONG BACKEND

```powershell
docker run -d --name smartfactory_backend --network smartfactory_network -e NODE_ENV=production -e HOST=0.0.0.0 -e PORT=3000 -e DB_HOST=smartfactory_database -e DB_PORT=5432 -e DB_NAME=smartfactory_db -e DB_USER=smartfactory -e DB_PASSWORD=smartfactory123 -e MONGODB_URI=mongodb://smartfactory:smartfactory123@smartfactory_mongodb:27017/smartfactory_media?authSource=admin -e JWT_SECRET=smartfactory-jwt-secret -v smartfactory_uploads:/app/uploads -p 0.0.0.0:3000:3000 smartfactory_connect_web-backend:latest
```

## BUOC 6: KHOI DONG FRONTEND

```powershell
docker run -d --name smartfactory_frontend --network smartfactory_network -p 0.0.0.0:80:80 smartfactory_connect_web-frontend:latest
```

## BUOC 7: KHOI DONG RAG SERVICE

```powershell
docker run -d --name smartfactory_rag --network smartfactory_network -e DB_HOST=smartfactory_database -e DB_PORT=5432 -e DB_NAME=smartfactory_db -e DB_USER=smartfactory -e DB_PASSWORD=smartfactory123 -e API_HOST=0.0.0.0 -e API_PORT=8001 -p 0.0.0.0:8001:8001 smartfactory_connect_web-rag_service:latest
```

## KIEM TRA

```powershell
# Xem containers
docker ps

# Xem logs
docker logs smartfactory_backend
docker logs smartfactory_frontend

# Xem IP may
ipconfig
```

## TRUY CAP

- Web: http://YOUR_IP
- Backend: http://YOUR_IP:3000
- RAG: http://YOUR_IP:8001

## DUNG HE THONG

```powershell
docker stop smartfactory_backend smartfactory_frontend smartfactory_rag smartfactory_database smartfactory_mongodb
docker rm smartfactory_backend smartfactory_frontend smartfactory_rag smartfactory_database smartfactory_mongodb
```

## KHOI DONG LAI

Chi can chay lai cac lenh docker run tu Buoc 2 den Buoc 7.
