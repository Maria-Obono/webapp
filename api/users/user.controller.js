const { createAccount, getUsersByUserId, getUsers, updateUser, deleteUser, getUsername} = require("./user.service");

const { genSaltSync, hashSync, compareSync} = require("bcrypt");
const {sign } = require("jsonwebtoken");


module.exports = {

    //CREATE USER FUNCTION
    createUser: (req, res) => {
        const body = req.body;
        //CHECK IF EMAIL EXIT IN THE DATABASE
getUsername(body.email, (err, results) => {

    if (err){
        console.log(err);
    }
    if(results){
        return res.status(400).json({
            message:"Email already exits"
        });
    }
    else{

        const salt = genSaltSync(10);
        body.password = hashSync(body.password, salt);
        createAccount(body, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    success: 0,
                    message: "Database connection error"
                });
            }
            return res.status(200).json({
                success: 1,
                message: "account created successfully",
                data: results
            });
        });
    }

    })
    },

//GET USER BY ID FUNCTION
    getUsersByUserId: (req, res) => {
        const id = req.params.id;
        getUsersByUserId(id, (err, results) => {
            if (err) {
                console.log(err);
                return;
            }
            if (!results) {
                return res.json({
                    success: 0,
                    message: "record not found"
                });
            }
            return res.json({
                success: 1,
                data: results
            });
        });
    },

    //GET USER FUNCTION
    getUsers: (req, res) => {
        getUsers((err, results) => {
            if (err) {
                console.log(err);
                return;
            }
            return res.json({
                success: 1,
                data:results
            });
        });
    },

    //UPDATE USER FUNCTION
    updateUser: (req, res) => {
        const body = req.body;
        const salt = genSaltSync(10);
        body.password = hashSync(body.password, salt);
        updateUser(body, (err, results, fields) => {
            if (err) {
                console.log(err);
                return;
            }
          
            if (!results) {
                return res.status(400).json({
                    success: 0,
                    message: "Failed to update user"
                })

            }

            if(body.email && body.id){
                return res.status(400).json({
                    success: 0,
                    message: "Email cannot be updated"
                })
            } 
            else{
            
            return res.json({
                success: 1,
                message: "account updated successfully"
            });
        }
        
        });

    },

//DELETE FUNCTION
    deleteUser: (req, res) => {
        const id = req.params.id;
        deleteUser(id, (err, results) => {

            if (!results) {
                return res.json({
                    success: 0,
                    message: "record not found"
                });
            
            }
            if(err) {
                console.log(err);
                
            }
            
            return res.json({
                success: 1,
                message: "user deleted successfully"
            });
            
        
        });
    }, 

    //LOGIN FUNCTION
    login: (req, res) => {
        const body = req.body;
        getUsername(body.email, (err, results) => {
            if (err) {
                console.log(err);
            }
            if (!results) {
                return res.json({
                    success: 0,
                    data: "Invalid email or password"

                });
            }
            const result= compareSync(body.password, results.password);
            if (result) {
                result.password = undefined;
                const jsonwebtoken= sign({result:results}, "qwe1234", {
                    expiresIn: "1h"
                });
                return res.json({
                    success:1,
                    message: "login successfully",
                    token: jsonwebtoken
                });
            }else {
                return res.json({
                    success:0,
                    data: "Invalid email or password"
                });
            }

        });
    }

};
