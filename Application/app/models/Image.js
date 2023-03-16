module.exports = (sequelize, Sequelize) => {

  //class Image extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
   // static associate({Product}) {
   //   this.belongsTo(Product, {foreignKey: 'product_id', as: 'products' })
  //  }
 // }
    const Image = sequelize.define("Image", {

      image_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
    
      
      product_id: {
        type:Sequelize.INTEGER,
        allowNull: false,
        

      },
      file_name: {
        type: Sequelize.STRING,
         

      },
      date_created: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
        
        
      },

      s3_bucket_path: {
        type: Sequelize.STRING,
        
      },
    }, {
      
      timestamps: false

    });

    Image.associate = (models) => {
      Image.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'id'
      });
    };
  
    return Image;
  };