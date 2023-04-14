packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
}

variable "ami_users" {
  type = list(string)
  default = ["272647741966"]
}

source "amazon-ebs" "webapp" {


  region         = "us-east-1"
  ami_name = "mysql-app-${local.timestamp}"
  ami_users = ["272647741966"]

  source_ami_filter {
    filters = {
      name                = "amzn2-ami-hvm-2.*.1-x86_64-gp2"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["amazon"]
  }
  


  instance_type = "t2.micro"
  ssh_username  = "ec2-user"
 

}

build {
  sources = [
    "source.amazon-ebs.webapp"
  ]

  provisioner "file" {
    source      = "./Application"
    destination = "/home/ec2-user/Application"
  }


  provisioner "file" {
    source      = "./webapp.service"
    destination = "/tmp/webapp.service"
  }

  //provisioner "file" {
    //source      = "./cloudwatch-agent-config.json"
    //destination = "/tmp/cloudwatch-agent-config.json"
  //}

  provisioner "shell" {
    script = "./app.sh"
    
  }

 #provisioner "shell" {
  #inline = [
    
    #"wget https://s3.us-east-1.amazonaws.com/amazoncloudwatch-agent-us-east-1/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
    #"sudo rpm -U ./amazon-cloudwatch-agent.rpm",

    #"sudo mv /tmp/cloudwatch-config.json /opt/cloudwatch-config.json",
    # Copy the CloudWatch agent config file to the appropriate location
    #"sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/bin/",
    #"sudo cp /opt/cloudwatch-config.json /opt/aws/amazon-cloudwatch-agent/bin/",

    # Set up the CloudWatch agent to start automatically
    #"sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a append-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/bin/cloudwatch-config.json",
    


    #"sudo systemctl enable amazon-cloudwatch-agent",
    #"sudo systemctl start amazon-cloudwatch-agent"

  #]
#}


}
