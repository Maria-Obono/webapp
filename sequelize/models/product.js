'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({User}) {
      this.belongsTo(User, {foreignKey: 'owner_user_id', as: 'users' })
    }
  }
  Product.init({
    id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
    name: {
        type:DataTypes.STRING,
      allowNull: false,
      isAlphanumeric: true,
      validate:{
        notNull: {msg: "Name is required"},
        notEmpty: {msg: "Name cannot be empty"},
      }
    },
    description: {
        type:DataTypes.STRING,
      allowNull: false,
      validate:{
        notNull: {msg: "description is required"},
        notEmpty: {msg: "description cannot be empty"},
      }
    },
    sku: {
        type:DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate:{
        notNull: {msg: "sku is required"},
        notEmpty: {msg: "sku cannot be empty"},
      }
    },
    manufacturer: {
        type:DataTypes.STRING,
      allowNull: false,
      validate:{
        notNull: {msg: "manufacturer is required"},
        notEmpty: {msg: "manufacturer cannot be empty"},
      }
    },
    quantity: {
        type:DataTypes.INTEGER,
      allowNull: false,
      validate:{
        notNull: {msg: "quantity is required"},
        notEmpty: {msg: "quantity cannot be empty"},
      }
    },

owner_user_id:{
    type:DataTypes.INTEGER,
    allowNull: false,
    
}, 
  }, 
  
  {
    sequelize,
    tableName: 'products',
    modelName: 'Product',
  });
  return Product;
};
