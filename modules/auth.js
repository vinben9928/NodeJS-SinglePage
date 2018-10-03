const fs = require("fs");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const db = require("./db");
const tk = require("./tk");
const isNull = require("./isNull");

//Input validation.
exports.validateInput = function(email, password) {
    const schema = Joi.object().keys({
        email: Joi.string().email({ minDomainAtoms: 2 }),
        password: Joi.string().min(3) //.regex(/^.{3,}$/)
    }).with('email', 'password');
    
    const result = Joi.validate({ email: email, password: password }, schema);

    if(result.error === null) {
        return true;
    }
    else {
        return result.error.details[0].message;
    }
};

//Authorization.
exports.loginAsync = function(email, password) {
    return new Promise(async (resolve, reject) =>
    {
        if(email === null) { reject("'email' cannot be null!"); return; }
        if(password === null) { reject("'password' cannot be null!"); return; }

        var user = { email: email, password: password }
        var validationResult = exports.validateInput(user);

        if(validationResult === true) {

            var dbconn = null;
            try {
                dbconn = await db.connectAsync();
            }
            catch(error) {
                console.log(error);
                reject("Couldn't connect to database!");
                return;
            }

            const existingUser = await new Promise((resolveUs, rejectUs) =>
            {
                dbconn.query("SELECT * FROM Users WHERE Email = ? LIMIT = 1", [email], function(error, result, fields) {
                    if(error) {
                        rejectUs("loginAsync() existing user error: " + error.toString());
                        reject("An unknown error occurred!");
                        return;
                    }

                    if(isNull(result.rows) || result.rows <= 0) {
                        rejectUs("User doesn't exist: " + email);
                        reject("Invalid e-mail or password!");
                        return;
                    }

                    resolveUs({ email: rows[0].Email, password: rows[1].Password });
                });
            }).catch(function(error) { console.log(error.toString()); });

            if(isNull(existingUser)) { return; }

            const token = await new Promise((resolveBcrypt, rejectBcrypt) =>
            {
                bcrypt.compare(user.password, existingUser.password, function(error, result) {
                    if(error) {
                        rejectBcrypt("loginAsync() bcrypt error: " + error.toString());
                        reject("An error occurred!");
                        return;
                    }
                    else if(result === true) {
                        console.log("User logged in! (" + user.email + ")");

                        //TODO...
                        //resolveBcrypt({ access_token: token });
                    }
                    else {
                        rejectBcrypt("Invalid password for user '" + existingUser.email + "'");
                        reject("Invalid e-mail or password!");
                    }
                });
            }).catch(function(error) { console.log(error.toString()); });

            if(token === undefined || token === null) { return; }

            resolve(token);
        }
        else {
            reject(validationResult === null ? "An unknown error occurred!" : validationResult.toString());
        }
    });
};

exports.verifyTokenAsync = function(token) {
    return new Promise(async (resolve, reject) => {
        if(typeof token !== "string") { reject("Token must be a string!"); return; }

        const data = await new Promise((resolveJwt, rejectJwt) => {
            jwt.verify(token, tk.node_auth_jwt_token, function(error, data) {
                if(error) {
                    rejectJwt("verifyTokenAsync() verifying error: " + error.toString());
                    reject("An error occurred!");
                    return;
                }

                resolveJwt(data);
            });
        }).catch(function(error) { console.log(error.toString()); });
        
        if(data === undefined || data === null) { return; }

        resolve(data);
    });
}

//User creation.
exports.createUserAsync = function(email, password) {
    return new Promise(async (resolve, reject) =>
    {
        if(email === null) { reject("'email' cannot be null!"); return; }
        if(password === null) { reject("'password' cannot be null!"); return; }

        var user = { email: email, password: password }
        var validationResult = exports.validateInput(user);

        user.password = null;
        user.id = new Date().getTime();

        if(validationResult === true)
        {
            const salt = await new Promise((resolveSalt, rejectSalt) => {
                bcrypt.genSalt(12, function(error, resultSalt) {
                    if(error) {
                        rejectSalt("createUserAsync() salting error: " + error.toString());
                        reject("An error occurred!");
                        return;
                    }
                    resolveSalt(resultSalt);
                });
            }).catch(function(error) { console.log(error.toString()); });

            if(salt === undefined || salt === null) { return; }
            
            const hash = await new Promise((resolveHash, rejectHash) => {
                bcrypt.hash(password, salt, function(error, resultHash) {
                    if(error) {
                        rejectHash("createUserAsync() hashing error: " + error.toString());
                        reject("An error occurred!");
                        return;
                    }
                    resolveHash(resultHash);
                });
            }).catch(function(error) { console.log(error.toString()); });

            if(hash === undefined || hash === null) { return; }

            user.password = hash;
            await saveUserAsync(user)
                .then(function(result) {
                    if(result === true) {
                        console.log("User added successfully! (" + user.email + ")");
                    }
                })
                .catch(function(error) {
                    console.log(error.toString());
                    reject("An error occurred!");
                    return;
                });

            resolve(true);
        }
        else {
            reject(validationResult === null ? "An unknown error occurred!" : validationResult.toString());
        }
    });
};