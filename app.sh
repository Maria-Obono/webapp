#!/bin/bash

sleep 30

sudo yum update -y

#sudo amazon-linux-extras install nginx1 -y;
#sudo mv /tmp/nginx.config /etc/systemd/system/nginx.config;
#sudo systemctl enable nginx
#sudo systemctl start nginx

sudo rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022
wget http://dev.mysql.com/get/mysql57-community-release-el7-8.noarch.rpm
sudo yum localinstall -y mysql57-community-release-el7-8.noarch.rpm
sudo yum install -y mysql-community-client

sudo yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_14.x | sudo -E bash -
sudo yum install -y nodejs
sudo npm install pm2 -g


cd ~/Application && npm install
npm i multer
npm i aws-sdk
npm i client-s3
npm i sequelize-cli
npm i @aws-sdk/client-cloudwatch-logs


sudo mv /tmp/webapp.service /etc/systemd/system/webapp.service
sudo systemctl enable webapp.service
sudo systemctl start webapp.service


