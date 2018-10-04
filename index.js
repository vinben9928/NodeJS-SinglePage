const express = require("express");
const db = require("./modules/db");
const dba = require("./modules/dba");
const session = require("express-session");
const FileStore = require('session-file-store')(session);
const uuid = require("uuid/v4");

const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    genid: (request) => {
        return uuid();
    },
    secret: dba.sess,
    store: new FileStore(),
    resave: false,
    saveUninitialized: false,
    unset: "keep",
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: true,
        maxAge: 15 * 60 * 1000 //15 minutes.
    }
}));

app.post("/create", async function(request, response) {
    if(request.body.post !== undefined && request.body.post !== null) {
        var result = await db.addPostAsync(request.body.post, request.body.meta, request.body.update);

        if(result.error !== undefined && result.error !== null) {
            response.send(JSON.stringify({ error: result.error }));
        }
        else if(result.success === true) {
            response.send(JSON.stringify({ success: true }));
        }
        else {
            response.send(JSON.stringify({ error: "An unknown error occurred!" }));
        }
    }
    else {
        response.send(JSON.stringify({ error: "Bad request!" }));
    }
});

app.post("/getPosts", async function(request, response) {
    var result = await db.getPostsAsync();
    
    if(result.error !== undefined && result.error !== null) {
        response.send(JSON.stringify({ error: result.error }));
    }
    else if(result.data !== undefined && result.data !== null) {
        response.send(JSON.stringify({ posts: result.data }));
    }
    else {
        response.send(JSON.stringify({ error: "An unknown error occurred!" }));
    }
});

app.post("/delete", async function(request, response) {
    if(request.body.id !== undefined && request.body.id !== null) {
        const id = parseInt(request.body.id);

        var dbconn = null;
        try {
            var dbconn = await db.connectAsync();
        }
        catch(error) {
            response.send(JSON.stringify({ error: "Couldn't connect to database!" }));
            return;
        }

        if(dbconn === undefined || dbconn === null) {
            response.send(JSON.stringify({ error: "Couldn't connect to database!" }));
            return;
        }

        dbconn.query("DELETE FROM posts WHERE ID = ?", id, function(error, result, fields) {
            if(error) {
                console.log(error);
                response.send(JSON.stringify({ error: "An unknown error occurred!" }));
                return;
            }
            
            response.send(JSON.stringify({ success: true }));
            if(dbconn !== null) { dbconn.end(function(error) {}); }
        });
    }
    else {
        response.send(JSON.stringify({ error: "Invalid request!" }));
    }
});

app.listen(80, function() {
    console.log("Server is listening on port 80!");
});
