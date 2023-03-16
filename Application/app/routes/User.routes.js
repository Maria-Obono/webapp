module.exports = app => {
  const db = require("../models");
  var router = require("express").Router();
  const User = db.Users;
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
  
  
  
  //Create USER
  router.post('/user', async (req, res) => {
    const { first_name, last_name, password, username } = req.body;
  
    // Check if user with email already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with that email address' });
    }
  
    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Create the user in the database
    const user = await User.create({
      first_name,
      last_name,
      password: hashedPassword,
      username,
      
    });
  
    // Return the created user, excluding the password field
    return res.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      account_created: new Date(),
      account_updated: new Date(),
    });
  });
  
  
  
  
  
  //UPDATE USER INFORMATION
  
  
  router.put('/user/:id', authenticate, async (req, res) => {
    const { first_name, last_name, password, username } = req.body;
    const { id } = req.params;
  
  
    // Find the user by ID
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(400).json({ message: 'Bad Request' });
    }
  
    // Update the user's information
    if (first_name) {
      user.first_name = first_name;
    }
    if (last_name) {
      user.last_name = last_name;
    }
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    if (username) {
      user.username = username;
    }
  
    // Save the updated user to the database
    await user.save();
  
    // Return a 204 No Content response
    return res.status(204).send({message: "user information updated successfully"});
  });
  



//GET USER INFORMATION
  
router.get('/user/:id', authenticate, async (req, res) => {
  const { id } = req.params;


  // Find the user by ID
  const user = await User.findByPk(id, {
    attributes: ['id', 'first_name', 'last_name', 'username', 'account_created', 'account_updated'],
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Return the user's information
  return res.json(user);
});



   //DELETE USER

router.delete('/user/:id',authenticate, async (req, res) => {
  const id = req.params.id;
  await User.destroy({where: {id: id}});
  res.send('removed');
});

  
    app.use('/v1', router);
  };