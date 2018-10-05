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
    }).with("email", "password");
    
    const result = Joi.validate({ email: email, password: password }, schema);

    if(result.error === null) {
        return true;
    }
    else {
        return result.error.details[0].message;
    }
};

exports.validateRegisterInput = function(email, password, firstName, lastName) {
    const schema = Joi.object().keys({
        email: Joi.string().email({ minDomainAtoms: 2 }),
        password: Joi.string().min(3),
        firstName: Joi.string().min(2),
        lastName: Joi.string().min(2)
    }).with("email", "password", "firstName", "lastName");
    
    const result = Joi.validate({ email: email, password: password, firstName: firstName, lastName: lastName }, schema);

    if(result.error === null) {
        return true;
    }
    else {
        return result.error.details[0].message;
    }
};

//Authorization.
exports.loginAsync = function(request, email, password) {
    return new Promise(async (resolve, reject) =>
    {
        if(isNull(request)) { reject("'request' cannot be null!"); return; }
        if(isNull(request.session)) { reject("Session not initialized!"); return; }
        if(isNull(email)) { reject("'email' cannot be null!"); return; }
        if(isNull(password)) { reject("'password' cannot be null!"); return; }

        var validationResult = exports.validateInput(email, password);
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

                    if(isNull(result.rows) || result.rows.length <= 0) {
                        rejectUs("User doesn't exist: " + email);
                        reject("Invalid e-mail or password!");
                        return;
                    }

                    resolveUs({ email: rows[0].Email, password: rows[1].Password });
                });
            }).catch(function(error) { console.log(error.toString()); });

            if(isNull(existingUser)) { return; }

            const loginSuccess = await new Promise((resolveBcrypt, rejectBcrypt) =>
            {
                bcrypt.compare(password, existingUser.password, function(error, result) {
                    if(error) {
                        rejectBcrypt("loginAsync() bcrypt error: " + error.toString());
                        reject("An error occurred!");
                        return;
                    }
                    else if(result === true) {
                        if(isNull(request.session)) {
                            rejectBcrypt("FATAL ERROR: Session doesn't exist!");
                            reject("An unknown error occurred!");
                            return;
                        }

                        request.session.loggedInAs = email;
                        console.log("User logged in! (" + email + ")");
                        resolveBcrypt(true);
                    }
                    else {
                        rejectBcrypt("Invalid password for user '" + existingUser.email + "'!");
                        reject("Invalid e-mail or password!");
                    }
                });
            }).catch(function(error) { console.log(error.toString()); });

            if(isNull(loginSuccess)) { resolve(false); return; }

            resolve(loginSuccess);
        }
        else {
            reject(isNull(validationResult) ? "An unknown error occurred!" : "Invalid e-mail or password!");
        }
    });
};

//User creation.
exports.createUserAsync = function(email, password, firstName, lastName) {
    return new Promise(async (resolve, reject) =>
    {
        if(isNull(email)) { reject("'email' cannot be null!"); return; }
        if(isNull(password)) { reject("'password' cannot be null!"); return; }
        if(isNull(firstName)) { reject("'firstName' cannot be null!"); return; }
        if(isNull(lastName)) { reject("'lastName' cannot be null!"); return; }

        var validationResult = exports.validateRegisterInput(email, password, firstName, lastName);
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

            if(isNull(hash)) { resolve(false); return; }

            var dbconn = null;
            try {
                dbconn = await db.connectAsync();
            }
            catch(error) {
                console.log(error);
                reject("Couldn't connect to database!");
                return;
            }

            if(isNull(dbconn)) { resolve(false); return; }

            dbconn.query("INSERT INTO Users(Email, Password, FirstName, LastName) VALUES (?, ?, ?, ?)", [email, password, firstName, lastName], function(error, result, fields) {
                if(error) {
                    console.log(error);
                    reject("An unknown error occurred!");
                    return;
                }

                resolve(true);
            });
        }
        else {
            reject(validationResult === null ? "An unknown error occurred!" : validationResult.toString());
        }
    });
};

//Logout.
exports.logoutAsync = function(request) {
    return new Promise((resolve, reject) => {
        if(isNull(request)) { reject("'request' cannot be null!"); return; }
        if(isNull(request.session)) { reject("Session not initialized!"); return; }

        request.session.destroy(function(error) {
            if(error) { console.log(error); }
            resolve(true);
        });
    });
}