module.exports = app => {
  const db = require("../models");
    var router = require("express").Router();
    //const User= require("../models")
    //const Product= require("../models")
    const Product = db.Products;
    const User= db.Users;
    const auth = require('basic-auth');
    const bcrypt = require('bcrypt'); 

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
  


//POST A PRODUCT
router.post('/product', authenticate, async (req, res) => {
  
    const { name, description, sku, manufacturer, quantity} = req.body;
    const owner_user_id = req.user.id; // Get the user id from the authenticated user

    
      // Check if the user exists
      const user = await User.findOne({ where: { id: owner_user_id } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
    // Create a new product with the input data
    Product.create({
      name,
      description,
      sku,
      manufacturer,
      quantity,
      owner_user_id
     
    })

      .then((product) => {
        // Return the product data as a JSON response
        res.json({
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
        res.status(500).json({ error: err.message });
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
  

  //PATCH REQUEST TO UPDATE THE PRODUCT

  router.patch('/product/:productId', authenticate,(req, res) => {
    const { productId } = req.params;
    const { name, description, sku, manufacturer, quantity } = req.body;
  
    Product.findOne({
      where: {
        id: productId,
        owner_user_id: req.user.id,
      },
    })
      .then((product) => {
        if (!product) {
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
  
    Product.destroy({
      where: {
        id: productId,
        owner_user_id: req.user.id,
      },
    })
      .then((numDeleted) => {
        if (numDeleted === 0) {
          res.status(404).json({ error: 'Product not found' });
        } else {
          res.sendStatus(204).json({message: 'product removed successfully'});
        }
      })
      .catch((err) => {
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
          res.status(404).json({ error: 'Product not found' });
        } else {
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
        res.status(500).json({ error: err.message });
      });
  });
  


  app.use('/v1', router);
};


