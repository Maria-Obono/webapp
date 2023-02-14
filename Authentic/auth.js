const auth= require("basic-authentication");
const db= require("../sequelize/models/index")

const mwBasicAuth = async(req, res, next) => {
    console.log('middleware: basic auth')

    const user = await auth(req)

    const username= db.username;
    const password= db.password;

    if (user.username === username && user.password === password){
console.log('Basic Auth: success')

    next()
    
}else {

    console.log('Basic Auth: success')
    res.statusCode= 401
    res.end('Access denied')
}

}
module.exports= mwBasicAuth;
