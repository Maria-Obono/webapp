module.exports = app => {
  const dbConfig = require("../../db.config.js");
  const db = require("../models");
  var router = require("express").Router();
  const User = db.Users;
  const auth = require('basic-auth');
  const bcrypt = require('bcrypt'); 
  const winston = require('winston');
  const winstonCloudWatch = require('winston-cloudwatch');
  const StatsD = require('hot-shots');

  //const statsdClient = new StatsD({host: 'localhost', port: 8125, prefix: 'webapp-maria'});
  const statsdClient = new StatsD({
    host: dbConfig.HOST,

    port: 8125,
    prefix: 'my-app',
    telegraf: true,
    awsConfig: {
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        
      },
    },
  });

// Create loggers

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



  //Create USER
  router.post('/user', async (req, res) => {
    const { first_name, last_name, password, username } = req.body;
  
    // Check if user with email already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      logger.info('User already exists with that email address', {username});
      return res.status(409).json({ message: 'User already exists with that email address' });
    }
  
    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);
  try{
    // Create the user in the database
    const user = await User.create({
      first_name,
      last_name,
      password: hashedPassword,
      username,
      
    });
    
   

    logger.info('User created successfully', {userId: user.id});
    statsdClient.increment('POST api: user.created');
    // Return the created user, excluding the password field
    return res.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      account_created: new Date(),
      account_updated: new Date(),
    });
  } catch (err )  {
    logger.error('Error creating user', {error: err});
    res.status(500).send('Internal Server Error');
  }
  
  });
  
  
  //UPDATE USER INFORMATION
  
  router.put('/user/:id', authenticate, async (req, res) => {
    const { first_name, last_name, password, username } = req.body;
    const { id } = req.params;
  
  try{
    // Find the user by ID
    const user = await User.findByPk(id);
    if (!user) {
      logger.info('User not found', {userId: id});
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
    logger.info('User information updated successfully', {userId: id});
    statsdClient.increment('UPDATE api: user.update.successful');
  
    // Return response
    return res.status(200).send({message: "user information updated successfully"});

  } catch (err )  {
    logger.error('Error updating user', {error: err});
    res.status(500).send('Internal Server Error');
  }
  });
  



//GET USER INFORMATION
  
router.get('/user/:id', authenticate, async (req, res) => {
  const { id } = req.params;

try{
  // Find the user by ID
  const user = await User.findByPk(id, {
    attributes: ['id', 'first_name', 'last_name', 'username', 'account_created', 'account_updated'],
  });
  if (!user) {
    logger.info('User not found', {userId: id});
    return res.status(204).json({ message: 'User not found' });
  }

  logger.info('User information retrieved successfully', {userId: id});
  statsdClient.increment('GET api: user.information retrieved.successful');

  // Return the user's information
  return res.json(user);
} catch (err )  {
  logger.error('Error getting user information', {error: err});
  res.status(500).send('Internal Server Error');
}
  
});



   //DELETE USER

router.delete('/user/:id',authenticate, async (req, res) => {
  const id = req.params.id;

  try{
  await User.destroy({where: {id: id}});
  logger.info('User deleted successfully', {userId: id});
  statsdClient.increment('DELETE api: user.deleted.successful');
  res.send('removed');

} catch (err )  {
  logger.error('Error deleting user', {error: err});
  res.status(500).send('Internal Server Error');
}

});

  
    app.use('/v1', router);
  };