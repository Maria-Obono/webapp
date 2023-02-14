'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      first_name: {
        type:Sequelize.STRING,
        allowNull: false,
        isAlphanumeric: true,
        validate:{
          notNull: {msg: "Name is required"},
          notEmpty: {msg: "Name cannot be empty"},
        }
      },
      last_name:{ 
        type:Sequelize.STRING,
        allowNull: false,
        validate:{
          notNull: {msg: "Name is required"},
          notEmpty: {msg: "Name cannot be empty"},
        }
    
      },
      username: {
        type:Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate:{
          isEmail: {msg: "It must be a valid Email address"},
        }
      },
      password: {
        type:Sequelize.STRING,
        allowNull: false,
        show: false
  
      },
    
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};