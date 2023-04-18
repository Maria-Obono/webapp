const express = require("express");
const cors = require("cors");
const app = express();
const dbConfig = require("./db.config");
require("dotenv/config"); 
const morgan = require('morgan');
const winston = require('winston');
const AWS = require('aws-sdk');
const StatsD = require('hot-shots');
//const awsBackend = require("node-statsd");
const { Transport } = require('winston');

const statsdClient = new StatsD({
  host: "localhost",
  port: 8125,
  prefix: 'api.',
  cloudwatch: {
    region: 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
      namespace: 'Maria-App',
      aws_iam_role: "EC2-CSYE6225",
      globalDimensions: {
      Environment: 'production',
      Application: 'my-app'
  }
},
backends: ['./backends/cloudwatch']   
});

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
    //new winston.transports.File({ filename: 'logs/sequelize.log' }),
    new winstonCloudWatch({
      logGroupName: "csye6225-demo",
      logStreamName: "webapp",
      awsAccessKeyId: process.env.AWS_ACCESS_KEY,
      awsSecretKey: process.env.AWS_SECRET_KEY,
      awsRegion: 'us-east-1'
    }) 
  ]
});

class StatsDTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.client = statsdClient;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

     //Write the log message to StatsD
    this.client.increment(info.message);
    callback();
  }
}

// Add the StatsD transport to the logger
logger.add(new StatsDTransport());



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
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});


const cloudwatch = new AWS.CloudWatch({ region: 'us-east-1' });


var corsOptions = {
  origin: "http://localhost:5051"
};

app.use(cors(corsOptions));


const db = require("./app/models");

const dropTablesWithForeignKeys = async () => {
  const tableNames = Object.keys(db.sequelize.models);

  for (const tableName of tableNames) {
    const table = db.sequelize.models[tableName];

    // Drop the table itself
    await table.drop();
  }
};

db.sequelize.sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

  dropTablesWithForeignKeys().then(() => {
    console.log("Dropped tables.");

  db.sequelize.sync({ force: true }).then(() => {
    console.log("Drop and re-sync db.");
  }).catch((err) => {
    console.log("Failed to drop and re-sync db: " + err.message);
  });
}).catch((err) => {
  console.log("Failed to drop tables: " + err.message);
});

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));


// simple route
app.get("/health", (req, res) => {
  const APIName= "/health"
  statsdClient.increment(`GET api.${APIName}.count.for health`);
  cloudwatch.putMetricData({
    Namespace: 'Maria-App',
    MetricData: [
      {
        MetricName: `api.${APIName}`,
        Timestamp: new Date(),
        Unit: 'Count',
        Value: 1
      }
    ]
  }, function(err, data) {
    if (err) {
      console.log('Error sending metrics to CloudWatch:', err);
    } else {
      console.log('Metrics sent to CloudWatch:', data);
    }
  });
  
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


