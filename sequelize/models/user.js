'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({Product}) {
      // define association here
      
      this.hasMany(Product, {foreignKey: 'owner_user_id', as: 'products' })
    }
  };
  User.init({

    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    first_name: {
      type:DataTypes.STRING,
      allowNull: false,
      isAlphanumeric: true,
      validate:{
        notNull: {msg: "Name is required"},
        notEmpty: {msg: "Name cannot be empty"},
      }
    },
    last_name:{ 
      type:DataTypes.STRING,
      allowNull: false,
      validate:{
        notNull: {msg: "Name is required"},
        notEmpty: {msg: "Name cannot be empty"},
      }
  
    },
    username: {
      type:DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate:{
        isEmail: {msg: "It must be a valid Email address"},
      }
    },
    password: {
      type:DataTypes.STRING,
      allowNull: false,
      privateColumn: true
    },
    
  }, 
  
{
    sequelize,
    tableName: 'users',
    modelName: 'User',

    privateColumns:['password']
   

  });

 
  return User;
};