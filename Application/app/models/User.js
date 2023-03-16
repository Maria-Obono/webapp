module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("User", {

      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      account_created: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        
      },
      account_updated: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        
      }
    }, {
      timestamps: false
      
    


    });
  
    return User;
  };