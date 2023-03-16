#!/bin/bash

export AWS_ACCESS_KEY_ID=AKIA2BZGFWDVEHXZ5BUA
export AWS_SECRET_ACCESS_KEY=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


sleep 30

sudo yum update -y

sudo amazon-linux-extras install nginx1 -y;
sudo mv /tmp/nginx.config /etc/systemd/system/nginx.config;
sudo systemctl enable nginx
sudo systemctl start nginx


sudo rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022
wget http://dev.mysql.com/get/mysql57-community-release-el7-8.noarch.rpm
sudo yum localinstall -y mysql57-community-release-el7-8.noarch.rpm
sudo yum install -y mysql-community-client

sudo yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_14.x | sudo -E bash -
sudo yum install -y nodejs
sudo npm install pm2 -g

#sudo yum install unzip -y
#cd ~/ && unzip mysql.zip
cd ~/Application && npm install
npm i multer
npm i aws-sdk
npm i client-s3
npm i sequelize-cli


sudo mv /tmp/mysql.service /etc/systemd/system/mysql.service
sudo systemctl enable mysql.service
sudo systemctl start mysql.service


