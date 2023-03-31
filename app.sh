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
npm i @aws-sdk/client-cloudwatch-logs


sudo mv /tmp/webapp.service /etc/systemd/system/webapp.service
sudo systemctl enable webapp.service
sudo systemctl start webapp.service

 
wget https://s3.us-east-1.amazonaws.com/amazoncloudwatch-agent-us-east-1/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
sudo cp /tmp/cloudwatch-agent-config.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s
sudo service amazon-cloudwatch-agent start

sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl start amazon-cloudwatch-agent