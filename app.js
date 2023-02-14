
const express = require("express");
const {sequelize, User, Product} = require('./sequelize/models'); // import models
const { genSaltSync, hashSync, compareSync} = require("bcrypt");
const app = express(); // create a new express app
const mwBasicAuth= require('./Authentic/auth.js')
const {body}= require("express-validation")

app.use(express.json());
//app.use(mwBasicAuth);
app.use(mwBasicAuth);

app.get('/healthz', function (req, res) {
    res.status(200)
});

app.listen({port: 5000}, async() =>{
    await sequelize.authenticate();
    //await Product.sync({ force: true });
});


// Create new user
app.post("/v1/user", async(req,res) =>{

   
    const salt = genSaltSync(10);
    req.body.password = hashSync(req.body.password, salt);
    const { first_name, last_name, username, password} = req.body;
    
    try{
        const user = await User.create({ first_name, last_name, username, password} );
        
        return res.json(user);
        
    }catch(err){
        return res.status(500).json(err);
            }
});


app.get('/v1/user/:id',  async (req, res) => {
   
    const id = req.params.id;

    const user = await User.findOne({where: {id: id}});
    if(!user){
        return res.status(401)
    }else{
    res.send(user);
    }
  });

  app.put('/v1/user/:id', async (req, res) => {
    const id = req.params.id;
    const { first_name, last_name, username, password} = req.body;
    try{
        const user = await User.findOne({
            where: {id}
        });
        user.first_name = first_name;
        user.last_name = last_name;
        user.username = username;
        user.password= password;

        await user.save();
        return res.json(user);

    }catch(err){
        return res.status(204).json({err: "Error, user does not exist"});
    }
});

//DELETE USER

app.delete('/v1/user/:id', async (req, res) => {
    const id = req.params.id;
    await User.destroy({where: {id: id}});
    res.send('removed');
  });



// Create new product
app.post('/v1/product', async(req,res) =>{
    const id = req.params.id;
    const { name, description, sku, manufacturer, quantity,owner_user_id} = req.body
    try{
        const user = await User.findOne({
            
            where: {id: owner_user_id} && (quantity >= 1)
        });
        const product = await Product.create({name, description, sku, manufacturer,quantity,owner_user_id :user.id });
        return res.json(product);
    }catch(err){
        return res.status(500).json(err);
    }
});

//GET PRODUCT

app.get('/v1/product/:id',  async (req, res) => {
   
    const id = req.params.id;

    const product = await Product.findOne({where: {id: id}});
    res.send(product);
  });



//PATCH PRODUCT
app.patch("/v1/product/:id", async(req, res) => {
    const id = req.params.id;
    const { name, description, sku, manufacturer, quantity} = req.body;
    try{
        const product = await Product.findOne({
            where: {id}
        });
        product.name = name;
        product.description = description;
        product.sku = sku;
        product.manufacturer= manufacturer;
        product.quantity= quantity;

        await product.save();
        return res.json({message:"product updated successfully"});

    }catch(err){
        return res.status(204).json({err: "Error, product does not exist"});
    }
});
  

//Update product
app.put("/v1/product/:id", async(req, res) => {
 
    const id = req.params.id;
    const { name, description, sku, manufacturer, quantity} = req.body;
    try{
        const product = await Product.findOne({
            where: {id}
        });
        product.name = name;
        product.description = description;
        product.sku = sku;
        product.manufacturer= manufacturer;
        product.quantity= quantity;

        await product.save();
        return res.json({message:"successfully updated"});

    }catch(err){
        return res.status(204).json({err: "Error, product does not exist"});
    }
}); 





//Delete product
app.delete("/v1/product/:id", async(req,res) =>{
 
    let id = req.params.id
    await Product.destroy({where: {id : id}})
    res.status(200).send("Product was deleted successfully")

});





