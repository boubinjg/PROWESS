sudo docker run --name webbackend -p 3001:3001 -v /edgestorage:/edgestorage -d --network=dockernet --ip=192.168.0.4 backend:latest 
