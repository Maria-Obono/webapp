
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
  

 //BASIC AUTHENTICATION FOR USERS
 const authenticate = async (req, res, next) => {
  const credentials = auth(req);
  if (!credentials || !credentials.name || !credentials.pass) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await User.findOne({ where: { username: credentials.name } });
    if (!user || !bcrypt.compareSync(credentials.pass, user.password)) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      req.user = user;
      next();
    }
  } catch (err) {
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
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  });
  
  //POST IMAGES
  router.post('/product/:product_id/image', authenticate, (req, res) => {
   

    upload(req, res, function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
  
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: req.file.originalname,
        Body: req.file.buffer,
        ACL: "public-read-write",
        ContentType: "image/jpeg"
      };
    
      s3.upload(params, async (error, data) => {
        if (error) {
          return res.status(500).json({ err: error });
        }
        
        
        const image = await Image.create({
          
          product_id: req.body.product_id,
          file_name: req.body.file_name,
          date_created: new Date(),
          s3_bucket_path: data.Location,
         
          
        });

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
  const { product_id, image_id } = req.params;

  const image = await Image.findOne({
    where: {
      product_id: product_id,
      image_id: image_id
    },
    attributes: ['image_id', 'product_id', 'file_name', 'date_created', 's3_bucket_path']
  });

  if (!image) {
    res.status(404).json({ message: 'Image not found' });
  } else {
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
  try {
    const { product_id } = req.params;
    const images = await Image.findAll({
      where: {
        product_id: product_id,
      },
      attributes: ['image_id', 'product_id', 'file_name', 'date_created', 's3_bucket_path']
    });
    res.json(images.map((res) => ({
      image_id: res.image_id,
      product_id: res.product_id,
      file_name: res.file_name,
      date_created: res.date_created,
      s3_bucket_path: res.s3_bucket_path,
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving images' });
  }
});


//DELETE IMAGES

router.delete('/product/:product_id/image/:image_id', authenticate, async (req, res) => {
  try {
    const { product_id, image_id } = req.params;
    const image = await Image.findOne({
      where: {
        product_id: product_id,
        image_id: image_id
      },
    });
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    await image.destroy();
    res.status(204).send({message:"image successfully deleted"});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});





    app.use('/v1', router);
  };