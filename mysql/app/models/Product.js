module.exports = (sequelize, Sequelize) => {
const User = require("../models")
    //class Product extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
       // static associate({User}) {
       //   this.belongsTo(User, {foreignKey: 'owner_user_id', as: 'users' })
       // }
     // }
    const Product = sequelize.define("Product", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: false
          },
          sku: {
            type: Sequelize.STRING,
            allowNull: false
          },
          manufacturer: {
            type: Sequelize.STRING,
            allowNull: false
          },
          quantity: {
            type: Sequelize.INTEGER,
            allowNull: false,
            
    validate: {
      min: 0,
    },
          },
          date_added: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          },
          date_last_updated: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
          },
          owner_user_id: {
            type: Sequelize.INTEGER
            
            
          },

    
      }, 
      
      {
       
        //timestamps: false,
        sequelize,
        tableName: 'products',
        modelName: 'Product',
      });
      Product.associate = (models) => {
        Product.belongsTo(models.User, {
          foreignKey: 'owner_user_id',
          as: 'id'
        });
      };
  
    return Product;
  };