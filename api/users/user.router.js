const { createUser, getUsersByUserId, getUsers, updateUser, deleteUser, login} = require("./user.controller");
const router = require("express").Router();
const {checkToken} = require("../../auth/token_validation");


//ROUTERS TO CHECK THE API
router.post("/signup", createUser);
router.get("/", getUsers);
router.get("/:id", getUsersByUserId);
router.put("/", updateUser);
router.delete("/:id", deleteUser);
router.post("/login", checkToken, login );

module.exports = router;


