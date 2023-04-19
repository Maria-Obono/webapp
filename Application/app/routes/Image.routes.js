
module.exports = app => {
  const dbConfig = require("../../db.config.js");
  const db = require("../models");
  const router = require("express").Router();
  const multer = require('multer');
  const AWS = require('aws-sdk');
  const auth = require('basic-auth');
  const bcrypt = require('bcrypt'); 
  const Image = db.Images;
  const User= db.Users;
  require("dotenv/config");
  const winston = require('winston');
  const winstonCloudWatch = require('winston-cloudwatch'); 
  const StatsD = require('hot-shots');

  const { Transport } = require('winston');
  
  
//const cloudwatch = new AWS.CloudWatch({ region: 'us-east-1'});


  const statsdClient = new StatsD({
    host: "localhost",
    port: 8125,
    prefix: 'api.',
    cloudwatch: {
      region: 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        namespace: 'Maria-api',
        aws_iam_role: "EC2-CSYE6225",
        globalDimensions: {
        Environment: 'production',
        Application: 'my-app'
    }
  },
  backends: ['./backends/cloudwatch']   
  });



//Create logger
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
  
      // Write the log message to StatsD
      this.client.increment(info.message);
      callback();
    }
  }
  
  // Add the StatsD transport to the logger
  logger.add(new StatsDTransport());
 

 //BASIC AUTHENTICATION FOR USERS
 const authenticate = async (req, res, next) => {
  logger.info('Received authentication request');
  const credentials = auth(req);
  if (!credentials || !credentials.name || !credentials.pass) {
    logger.warn('Unauthorized access attempt');
    res.status(401).json({ error: 'Unauthorized' });
    
    return;
  }

  try {
    const user = await User.findOne({ where: { username: credentials.name } });
    if (!user || !bcrypt.compareSync(credentials.pass, user.password)) {
      logger.warn('Invalid username or password');
      res.status(401).json({ error: 'Unauthorized' });
      
    } else {
      logger.info('User successfully authenticated');
      req.user = user;
      next();
    }
  } catch (err) {
    logger.error(`Error during authentication: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};


//S3 BUCKET

  const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
      cb(null, '')
    }
  });
  
  const filefilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  
  const upload = multer({ storage: storage, fileFilter: filefilter }).single('productimage');

  
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY, secretAccessKey: process.env.AWS_SECRET_KEY, region: 'us-east-1'
});



  
  //POST IMAGES
  router.post('/product/:product_id/image', authenticate, (req, res) => {
    const APIName = 'v1/product/:product_id/image';
    
    logger.info('Received POST request to upload image');
    upload(req, res, function (err) {
      if (err) {
        logger.error('Error occurred while uploading image:', err);
        return res.status(500).json({ message: err.message });
      }
      
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: req.file.originalname + '-' + Date.now(),
        Body: req.file.buffer,
        //ACL: "public-read-write",
        ACL: "private",
        ContentType: "image/jpeg"
      };
    
      s3.upload(params, async (error, data) => {
        if (error) {
          logger.error('Error occurred while uploading image to S3:', error);
          return res.status(500).json({ err: error });
        }
        
        logger.info('Image uploaded to S3 successfully');


        const image = await Image.create({
          
          product_id: req.params.product_id,
          file_name: req.file.originalname,
          date_created: new Date(),
          s3_bucket_path: data.Location,
         
          
        });
        logger.info('Image details saved to database:', image);
            res.status(200).json({
              image_id: image.image_id,
              product_id: image.product_id,
              file_name: image.file_name,
              date_created: image.date_created,
              s3_bucket_path: data.Location,
            });
      });
      
    }); 
    
    statsdClient.increment(`POST api.${APIName}.count.Image uploaded to S3 successfully`);
        cloudwatch.putMetricData({
          Namespace: 'Maria-api',
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
        
  });
 
  

//GET IMAGE DETAILS  

router.get('/product/:product_id/image/:image_id', authenticate, async (req, res) => {
  const APIName = 'v1/product/:product_id/image/:image_id';
    
  logger.info('Received GET request to fetch image details');
  statsdClient.increment('GET api for an image detail');
  const { product_id, image_id } = req.params;

  const image = await Image.findOne({
    where: {
      product_id: product_id,
      image_id: image_id
    },
    attributes: ['image_id', 'product_id', 'file_name', 'date_created', 's3_bucket_path']
  });

  if (!image) {
    logger.error('Image not found');
    res.status(404).json({ message: 'Image not found' });
  } else {
    logger.info('Returning image details:', image);


    statsdClient.increment(`GET api.${APIName}.count.Returning image details`);
    cloudwatch.putMetricData({
      Namespace: 'Maria-api',
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
    

    res.json({
      image_id: image.image_id,
      product_id: image.product_id,
      file_name: image.file_name,
      date_created: image.date_created,
      s3_bucket_path: image.s3_bucket_path,
    });
  }
});



//GET ALL IMAGES CREATED DETAILS

router.get('/product/:product_id/image', authenticate, async (req, res) => {
  const APIName = 'v1/product/:product_id/image';
    
  logger.info('Received GET request to fetch all images for a product');
  try {
    const { product_id } = req.params;
    const images = await Image.findAll({
      where: {
        product_id: product_id,
      },
      attributes: ['image_id', 'product_id', 'file_name', 'date_created', 's3_bucket_path']
    });
    logger.info(`Returning details for ${images.length} images`);


    statsdClient.increment(`GET api.${APIName}.count.returning details for all images`);
    cloudwatch.putMetricData({
      Namespace: 'Maria-api',
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
    

    res.json(images.map((res) => ({
      image_id: res.image_id,
      product_id: res.product_id,
      file_name: res.file_name,
      date_created: res.date_created,
      s3_bucket_path: res.s3_bucket_path,
    })));
  } catch (error) {
    logger.error('Error occurred while fetching images:', error);
    res.status(500).json({ message: 'Error retrieving images' });
  }
});


//DELETE IMAGES

router.delete('/product/:product_id/image/:image_id', authenticate, async (req, res) => {
  const APIName = 'v1/product/:product_id/image/:image_id';
    
  logger.info('Received DELETE request to delete image');
  try {
    const { product_id, image_id } = req.params;
    const image = await Image.findOne({
      where: {
        product_id: product_id,
        image_id: image_id
      },
    });
    if (!image) {
      logger.warn('Image not found');
      return res.status(404).json({ message: 'Image not found' });
    }
    await image.destroy();
    logger.info('Image successfully deleted');


    statsdClient.increment(`DELETE api.${APIName}.count.image_deleted`);
    cloudwatch.putMetricData({
      Namespace: 'Maria-api',
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
    


    res.status(200).send({message:"image successfully deleted"});
  } catch (error) {
    logger.error(`Error deleting image: ${error}`);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

    app.use('/v1', router);
  };
