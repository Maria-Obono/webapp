module.exports = app => {
  const dbConfig = require("../../db.config.js");
  const db = require("../models");
    var router = require("express").Router();
    //const User= require("../models")
    //const Product= require("../models")
    const Product = db.Products;
    const User= db.Users;
    const auth = require('basic-auth');
    const bcrypt = require('bcrypt'); 
   
    const winston = require('winston');
    const winstonCloudWatch = require('winston-cloudwatch');
    const StatsD = require('hot-shots');
    const statsdClient = new StatsD({host: 'localhost', port: 8125, prefix: 'webapp-maria'});


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
    }),
    //new winston.transports.StatsD({statsdClient: statsdClient}),
  ]
});

class StatsDTransport extends winston.Transport {
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

//POST A PRODUCT
router.post('/product', authenticate, async (req, res) => {
  
    const { name, description, sku, manufacturer, quantity} = req.body;
    
      // Check if the user exists
      const user = await User.findOne({ where: { id: req.user.id } });
      statsdClient.increment('A Product has been POST');
      if (!user) {
        logger.error(`User with id ${req.user.id} not found`);
        return res.status(404).json({ error: 'User not found' });
      }
    // Create a new product with the input data
    Product.create({
      name,
      description,
      sku,
      manufacturer,
      quantity,
      owner_user_id: req.user.id
     
    })

      .then((product) => {
        // Return the product data as a JSON response
        logger.info(`New product with id ${product.id} has been created`);
        res.status(201).json({
          id: product.id,
          name: product.name,
          description: product.description,
          sku: product.sku,
          manufacturer: product.manufacturer,
          quantity: product.quantity,
          date_added: product.createdAt,
          date_last_updated: product.updatedAt,
          owner_user_id: product.owner_user_id

        });
      })
    
    .catch((err) => {
        // Handle any errors that occur during product creation
        if (err.name === 'SequelizeValidationError') {
          logger.error(`Validation error: ${err.message}`);
          res.status(400).json({ error: err.message });
        } else if (err.name === 'UnauthorizedError') {
          logger.error(`Unauthorized: ${err.message}`);
          res.status(401).json({ error: 'Unauthorized' });
        } else if (err.name === 'ForbiddenError') {
          logger.error(`Forbidden: ${err.message}`);
          res.status(403).json({ error: 'Forbidden' });
        } else {
          logger.error(`Internal Server Error: ${err.message}`);
        res.status(500).json({ error: err.message });
        }
      });
    
  
  });


  //UPDATE A NEW PRODUCT
  router.put('/product/:id', authenticate, (req, res) => {
    const { name, description, sku, manufacturer, quantity } = req.body;
    const { productId } = req.params;
  
    Product.findOne({
      where: {
        id: productId,
        owner_user_id: req.user.id,
      },
    })
      .then((product) => {
        if (!product) {
          logger.error(`Product with id ${productId} not found`);
          res.status(404).json({ error: 'Product not found' });
        } else {
          product.name = name;
          product.description = description;
          product.sku = sku;
          product.manufacturer = manufacturer;
          product.quantity = quantity;
          return product.save();
          
        }
      })
      .then((product) => {
        if (!product) {
          res.status(204).send();
        } else {
          logger.info(`Product with id ${productId} has been updated`);
          statsdClient.increment('A Product has been updated using PUT api request');
          res.json({
            id: product.id,
            name: product.name,
            description: product.description,
            sku: product.sku,
            manufacturer: product.manufacturer,
            quantity: product.quantity,
            date_added: product.createdAt,
            date_last_updated: product.updatedAt,
            owner_user_id: product.owner_user_id,
          });
        }
      })
      .catch((err) => {
        if (err.name === 'SequelizeValidationError') {
          logger.error(`Validation error: ${err.message}`);
          res.status(400).json({ error: err.message });
        } else if (err.name === 'UnauthorizedError') {
          logger.error(`Unauthorized: ${err.message}`);
          res.status(401).json({ error: 'Unauthorized' });
        } else if (err.name === 'ForbiddenError') {
          logger.error(`Forbidden: ${err.message}`);
          res.status(403).json({ error: 'Forbidden' });
        } else {
          logger.error(`Internal Server Error: ${err.message}`);
          res.status(500).json({ error: err.message });
        }
      });
  });
  

  //PATCH REQUEST TO UPDATE THE PRODUCT

  router.patch('/product/:productId', authenticate,(req, res) => {
    const { productId } = req.params;
    const { name, description, sku, manufacturer, quantity } = req.body;

    logger.info('PATCH request received to update product with ID ' + productId, { user_id: req.user.id });
  
    Product.findOne({
      where: {
        id: productId,
        owner_user_id: req.user.id,
      },
    })
      .then((product) => {
        if (!product) {
          logger.warn('Product with ID ' + productId + ' not found', { user_id: req.user.id });
          res.status(404).json({ error: 'Product not found' });
        } else {
          if (name) product.name = name;
          if (description) product.description = description;
          if (sku) product.sku = sku;
          if (manufacturer) product.manufacturer = manufacturer;
          if (quantity >= 0) product.quantity = quantity;
          return product.save();
        }
      })
      .then((product) => {
        logger.info('Product with ID ' + productId + ' updated successfully', { user_id: req.user.id });
        statsdClient.increment('Product with ID ' + productId + ' updated successfully using PATCH api', { user_id: req.user.id });
        res.json({
          id: product.id,
          name: product.name,
          description: product.description,
          sku: product.sku,
          manufacturer: product.manufacturer,
          quantity: product.quantity,
          date_added: product.createdAt,
          date_last_updated: product.updatedAt,
          owner_user_id: product.owner_user_id,
        });
      })
      .catch((err) => {
        logger.error('Error updating product with ID ' + productId, { user_id: req.user.id, error: err });
        if (err.name === 'SequelizeValidationError') {
          res.status(400).json({ error: err.message });
        } else if (err.name === 'UnauthorizedError') {
          res.status(401).json({ error: 'Unauthorized' });
        } else if (err.name === 'ForbiddenError') {
          res.status(403).json({ error: 'Forbidden' });
        } else {
          res.status(500).json({ error: err.message });
        }
      });
  });
  
//DELETE PRODUCT BASED ON USER ID
  router.delete('/product/:productId', authenticate, (req, res) => {
    const { productId } = req.params;
    logger.info('DELETE request received to remove product with ID ' + productId, { user_id: req.user.id });
    Product.destroy({
      where: {
        id: productId,
        owner_user_id: req.user.id,
      },
    })
      .then((numDeleted) => {
        if (numDeleted === 0) {
          logger.warn('Product with ID ' + productId + ' not found', { user_id: req.user.id });
          res.status(404).json({ error: 'Product not found' });
        } else {
          logger.info('Product with ID ' + productId + ' removed successfully', { user_id: req.user.id });
          statsdClient.increment('DELETE api, Product with ID ' + productId + ' was removed successfully ');
          res.sendStatus(204).json({message: 'product removed successfully'});
        }
      })
      .catch((err) => {
        logger.error('Error removing product with ID ' + productId, { user_id: req.user.id, error: err });
        if (err.name === 'UnauthorizedError') {
          res.status(401).json({ error: 'Unauthorized' });
        } else if (err.name === 'ForbiddenError') {
          res.status(403).json({ error: 'Forbidden' });
        } else {
          res.status(500).json({ error: err.message });
        }
      });
  });
  
  //GET REQUEST FOR ALL USERS TO GET THE PRODUCT DETAILS
  router.get('/product/:productId', (req, res) => {
    const { productId } = req.params;
  
    Product.findOne({
      where: { id: productId },
    })

    
      .then((product) => {
        if (!product) {
          logger.error('Product not found', { productId });
          res.status(404).json({ error: 'Product not found' });
        } else {
          logger.info('Product found', { productId });
          statsdClient.increment('GET api to found product');
          res.json({
            id: product.id,
            name: product.name,
            description: product.description,
            sku: product.sku,
            manufacturer: product.manufacturer,
            quantity: product.quantity,
            date_added: product.createdAt,
            date_last_updated: product.updatedAt,
            owner_user_id: product.owner_user_id,
          });
        }
      })
    .catch((err) => {
      logger.error('error getting product', { productId, error: err });
        res.status(500).json({ error: err.message });
      });
  });
  


  app.use('/v1', router);
};


