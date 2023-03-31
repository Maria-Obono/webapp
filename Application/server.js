const express = require("express");
const cors = require("cors");
const app = express();

const morgan = require('morgan');
const winston = require('winston');
const AWS = require('aws-sdk');


const winstonCloudWatch = require('winston-cloudwatch');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      timestamp: true,
      colorize: true
    }),
    new winston.transports.File({ filename: 'logs/sequelize.log' }),
    new winstonCloudWatch({
      logGroupName: 'csye6225-demo',
      logStreamName: 'webapp',
      createLogGroup: true,
      createLogStream: true,
      awsAccessKeyId: process.env.AWS_ACCESS_KEY,
      awsSecretKey: process.env.AWS_SECRET_KEY,
      awsRegion: 'us-east-1'
    })
  ]
});

// Configure Morgan logger
const morganLogger = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
});

// Use Morgan logger in app middleware
app.use(morganLogger);

AWS.config.update({
  region: 'us-east-1',
});

const cloudwatch = new AWS.CloudWatch();

function recordExecutionTime(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const end = Date.now();
    const executionTimeInMilliseconds = end - start;
    const apiName = req.path;
    const params = {
      
      MetricData: [
        {
          MetricName: 'csye6225_endpoint_homepage_http_get',
          Value: executionTimeInMilliseconds,
          Dimensions: [
            {
              Name: 'host, metric_type',
              Value: apiName,
            },
          ],
        },
      ],
      Namespace: 'CWAgent_API',
    };
    cloudwatch.putMetricData(params, (err, data) => {
      if (err) {
        logger.error('Failed to put metric data: ', err);
      } else {
        logger.info('Successfully put metric data: ', data);
      }
    });
  });
  next();
}


var corsOptions = {
  origin: "http://localhost:5051"
};

app.use(cors(corsOptions));


const db = require("./app/models");
db.sequelize.sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

  db.sequelize.sync({ force: true }).then(() => {
    console.log("Drop and re-sync db.");
  });

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));


// simple route
app.get("/healthz", recordExecutionTime, (req, res) => {
  
  return res.status(200).send({ message: "Welcome to my application." });
  
});


require("./app/routes/User.routes")(app);
require("./app/routes/Image.routes")(app);
require("./app/routes/Product.routes")(app);



// set port, listen for requests
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}.`);
  
});

module.exports = logger;