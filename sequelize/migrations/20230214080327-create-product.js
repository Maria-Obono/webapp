'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type:Sequelize.STRING,
      allowNull: false,
      isAlphanumeric: true,
      validate:{
        notNull: {msg: "Name is required"},
        notEmpty: {msg: "Name cannot be empty"},
      }
    },
    description: {
        type:Sequelize.STRING,
      allowNull: false,
      validate:{
        notNull: {msg: "description is required"},
        notEmpty: {msg: "description cannot be empty"},
      }
    },
    sku: {
        type:Sequelize.STRING,
      allowNull: false,
      validate:{
        notNull: {msg: "sku is required"},
        notEmpty: {msg: "sku cannot be empty"},
      }
    },
    manufacturer: {
        type:Sequelize.STRING,
      allowNull: false,
      validate:{
        notNull: {msg: "manufacturer is required"},
        notEmpty: {msg: "manufacturer cannot be empty"},
      }
    },
    quantity: {
        type:Sequelize.INTEGER,
      allowNull: false,
      validate:{
        notNull: {msg: "quantity is required"},
        notEmpty: {msg: "quantity cannot be empty"},
      }
    },

owner_user_id:{
    type:Sequelize.INTEGER,
    allowNull: false,
    validate:{
      notNull: {msg: "quantity is required"},
      notEmpty: {msg: "quantity cannot be empty"},
    }
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
    await queryInterface.dropTable('Products');
  }
};