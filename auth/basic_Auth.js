function auth (req, res, next){
    var authHeader = req.headers.authorization;
    if(!authHeader){
        
        var err = new Error('You are not authenticated')
        return res.status(401,'WWW-Authenticate','Basic').json({
            message:"You are not authenticated",
           
        });
       
    }

    var auth = new Buffer(authHeader.split(' ')[1], 'base64').toString().split(':')
    var username = auth[0]
    var password = auth[1]

    if(username == 'Lee@gmail.com' && password =='Lee1'){
        next();
    }else{
        var err = new Error('You are not authenticated')
        
        return res.status(401,'WWW-Authenticate','Basic').json({
            message:"You are not authenticated",
           
        });
       
    }

}

module.exports = auth;
