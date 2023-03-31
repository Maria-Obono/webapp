const dbConfig = require("../../db.config.js");



const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  //logging: (msg) => logger.info(msg),

  

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Users = require("./User.js")(sequelize, Sequelize);
db.Images = require("./Image.js")(sequelize, Sequelize);
db.Products = require("./Product.js")(sequelize, Sequelize);


// 1 to Many Relation





db.Products.belongsTo(db.Users, {
  foreignKey: 'owner_user_id',
  as: 'user'
})

db.Products.hasMany(db.Images, {
  foreignKey: 'product_id',
  as: 'Image'
})

db.Images.belongsTo(db.Products, {
  foreignKey: 'product_id',
  as: 'product'
})


module.exports = db;