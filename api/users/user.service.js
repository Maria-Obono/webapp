
const pool = require("../../config/database");

module.exports = {
    createAccount: (data, callBack) => {
        pool.query(
            `insert into assignments.registration (first_name, last_name, email, password,account_created, account_updated)
                        values(?,?,?,?, now(), now())`,

            [
               data.first_name,
               data.last_name,
               data.email,
               data.password,
               data.account_created,
               data.account_updated
                
            ],
          (error, results, fields) => {
               if(error) {
                return callBack(error);
                }
               return callBack(null, results)
            }
        );
    },

    getUsers: callBack => {
        pool.query(
            `select id, first_name, last_name, email from assignments.registration ;`,
            [],
            (error,results,fields) => {
                if(error) {
                 return   callBack(error);
                }
                return callBack(null, results)
            }
        );
    },

    getUsersByUserId: (id, callBack) => {
        pool.query(
            `select id, first_name,last_name, email from assignments.registration where id= ?`,
            [id],
            (error, results, fields) => {
                if (error){
                    callBack(error);
                }
                return callBack(null, results[0]);
            }
        );
    },

    updateUser: (data, callBack) => {
        pool.query(
            `update assignments.registration set first_name=?, last_name=?, password=?, account_updated= now()
            where id =?`,
            [
                data.first_name,
                data.last_name,
                data.password,
                data.id,
                data.account_updated
            ],
            (error, results, fields) => {
                if (error) {
                    callBack(error);
                         
                }
                return callBack(null, results);

            }
        );
    },

    deleteUser: (id, callBack) => {
        pool.query(
            `delete from assignments.registration where id = ?`,
            [id],
            (error, results, fields) => {
                if (error) {
                    return callBack(error);
                }
                return callBack(null, results[0]);
            }
        );
    },

    getUsername: (email, callBack) => {
        pool.query(
            `select * from assignments.registration where email =?` ,
            [email],
            (error, results, fields) => {
                if(error) {
                    callBack(error);
                }
                return callBack(null, results[0]);
            }
        );
    }
};

   