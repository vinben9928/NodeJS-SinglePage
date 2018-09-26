const mysql = require("mysql");
const Joi = require("joi");
const escapeHtml = require("escape-html");
const dba = require("./dba");

exports.connectAsync = async function() {
    try {
        var connection = mysql.createConnection({host: "localhost", user: "root", password: dba.db(), database: "node"});

        await new Promise((resolve, reject) => {
            connection.connect(function(error) {
                if(error) { reject(error); return; }
                console.log("Connection established to database!");
                resolve();
            });
        });

        return connection;
    }
    catch(error) {
        console.log(error);
        return null;
    }
};

exports.addPostAsync = async function(contents, meta) {
    try {
        var connection = await exports.connectAsync();
        if(connection !== null) {
            if(contents === undefined || contents === null || typeof contents !== "string" || contents.length <= 0) {
                return { error: "Contents must be a valid string!" };
            }

            const joiSchema = Joi.object().keys({
                contents: Joi.string().alphanum().min(15).required()
            }).with("contents");
            
            const joiResult = Joi.validate({contents: contents}, schema);
            if(joiResult.error !== null) { return { error: joiResult.error }; }
            
            var data = [escapeHtml(contents)];
            if(meta !== undefined && meta !== null) {
                try {
                    data.push(JSON.stringify(JSON.parse(meta)));
                }
                catch(error) {
                    console.log(error);
                    return { error: "'meta' must be a valid JSON object!" };
                }
            }

            try {
                await new Promise((resolve, reject) => {
                    connection.query(`INSERT INTO posts(Data${data.length > 1 ? ", Meta" : ""}) VALUES (?${data.length > 1 ? ", ?" : ""})`, data, function(error, results, fields) {
                        if(error) { reject(error); return; }
                        resolve(true);
                    });
                });

                return { success: true };
            }
            catch(error) {
                console.log(error);
                return { error: "Failed to add post!" };
            }
        }
        else {
            return { error: "Couldn't connect to database!" };
        }
    }
    catch(error) {
        console.log(error);
        return { error: "An unknown error occurred!" };
    }
};

exports.getPostsAsync = async function() {
    var connection = await exports.connectAsync();
    if(connection !== null) {
        try {
            var rows = await new Promise((resolve, reject) => {
                connection.query("SELECT * FROM posts", data, function(error, results, fields) {
                    if(error) { reject(error); return; }
                    resolve(results);
                });
            });

            var data = [];
            for(row in rows) {
                try {
                    data.push({ data: row.Data, meta: JSON.parse(row.Meta), timestamp: row.Timestamp });
                }
                catch(error) { console.log(error); }
            }

            return { data: data };
        }
        catch(error) {
            console.log(error);
            return { error: "Failed to add post!" };
        }
    }
    else {
        return { error: "Couldn't connect to database!" };
    }
};