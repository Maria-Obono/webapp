
module.exports = app => {
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
    accessKeyId: process.env.AWS_ACCESS_KEY
});
  
  //POST IMAGES
  router.post('/product/:product_id/image', authenticate, (req, res) => {
   
    logger.info('Received POST request to upload image');
    upload(req, res, function (err) {
      if (err) {
        logger.error('Error occurred while uploading image:', err);
        return res.status(500).json({ message: err.message });
      }
      
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: req.file.originalname,
        Body: req.file.buffer,
        ACL: "public-read-write",
        ContentType: "image/jpeg"
      };
    
      s3.upload(params, async (error, data) => {
        if (error) {
          logger.error('Error occurred while uploading image to S3:', error);
          return res.status(500).json({ err: error });
        }
        
        logger.info('Image uploaded to S3 successfully');
        const image = await Image.create({
          
          product_id: req.body.product_id,
          file_name: req.body.file_name,
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
  });
 
  

//GET IMAGE DETAILS  

router.get('/product/:product_id/image/:image_id', authenticate, async (req, res) => {
  logger.info('Received GET request to fetch image details');
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
    res.status(200).send({message:"image successfully deleted"});
  } catch (error) {
    logger.error(`Error deleting image: ${error}`);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

    app.use('/v1', router);
  };
