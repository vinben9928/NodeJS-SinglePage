const mysql = require("mysql");
const Joi = require("joi");
const escapeHtml = require("escape-html");
const dba = require("./dba");

exports.connectAsync = async function() {
    var connection = null;
    try {
        connection = mysql.createConnection({host: "localhost", user: "root", password: dba.db(), database: "node"});

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
        if(connection !== null) { connection.end(function(error) {}); }
        console.log(error);
        return null;
    }
};

exports.addPostAsync = async function(contents, meta, update) {
    var connection = null;
    try {
        connection = await exports.connectAsync();
        if(connection !== null) {
            if(contents === undefined || contents === null || typeof contents !== "string" || contents.length <= 0) {
                return { error: "Contents must be a valid string!" };
            }

            const joiSchema = Joi.object().keys({
                contents: Joi.string().min(15).required()
            });
            
            const joiResult = Joi.validate({contents: contents}, joiSchema);
            if(joiResult.error !== null) { return { error: joiResult.error.details[0].message }; }
            
            var updateId = null;
            if(update !== undefined && update !== null) {
                updateId = parseInt(update);
                if(isNaN(updateId)) {
                    return { error: "Bad request!" };
                }
            }

            var hasMeta = false;
            var isUpdate = updateId !== undefined && updateId !== null && typeof updateId === "number";
            var data = [escapeHtml(contents)];

            if(meta !== undefined && meta !== null) {
                try {
                    data.push(JSON.stringify(meta));
                    hasMeta = true;
                }
                catch(error) {
                    connection.end(function(error) {});
                    console.log(error);
                    return { error: "'meta' must be a valid JSON object!" };
                }
            }
            
            if(isUpdate == true) { data.push(updateId); }

            const query = (isUpdate == true ?
                `UPDATE posts SET Timestamp = NULL, Data = ?${hasMeta === true ? ", Meta = ?" : ""} WHERE ID = ?` :
                `INSERT INTO posts(Data${hasMeta == true ? ", Meta" : ""}) VALUES (?${hasMeta == true ? ", ?" : ""})`
            );

            try {
                await new Promise((resolve, reject) => {
                    connection.query(query, data, function(error, results, fields) {
                        if(error) { reject(error); return; }
                        resolve(true);
                    });
                });

                return { success: true };
            }
            catch(error) {
                connection.end(function(error) {});
                console.log(error);
                return { error: "Failed to add post!" };
            }
        }
        else {
            connection.end(function(error) {});
            return { error: "Couldn't connect to database!" };
        }
    }
    catch(error) {
        if(connection !== null) { connection.end(function(error) {}); }
        console.log(error);
        return { error: "An unknown error occurred!" };
    }
};

exports.getPostsAsync = async function() {
    var connection = null;
    try {
        connection = await exports.connectAsync();
        if(connection !== null) {
            var rows = await new Promise((resolve, reject) => {
                connection.query("SELECT * FROM posts", function(error, results, fields) {
                    if(error) { reject(error); return; }
                    resolve(results);
                });
            });

            var data = [];
            for(var i = 0; i < rows.length; i++) {
                var row = rows[i];
                try {
                    data.push({ id: row.ID, data: row.Data, meta: JSON.parse(row.Meta !== undefined ? row.Meta : null), timestamp: row.Timestamp });
                }
                catch(error) { console.log(error); }
            }

            connection.end(function(error) {});
            return { data: data };
        }
        else {
            return { error: "Couldn't connect to database!" };
        }
    }
    catch(error) {
        if(connection !== null) { connection.end(function(error) {}); }
        console.log(error);
        return { error: "Failed to get posts!" };
    }
};