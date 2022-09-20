sudo docker run --name webappdb -e MYSQL_ROOT_PASSWORD=my-secret-pw -d --net dockernet --ip 192.168.0.2 test:latest --default-authentication-plugin=mysql_native_password
