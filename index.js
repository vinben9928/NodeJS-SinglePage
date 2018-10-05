const express = require("express");
const db = require("./modules/db");
const dba = require("./modules/dba");
const auth = require("./modules/auth");
const session = require("express-session");
const FileStore = require('session-file-store')(session);
const uuid = require("uuid/v4");
const isNull = require("./modules/isNull");

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

app.post("/login", async function(request, response) {
    try {
        var result = await auth.loginAsync(request, request.body.email, request.body.password);

        if(!isNull(result) && result === true) {
            response.send(JSON.stringify({ success: true }));
        }
        else {
            response.send(JSON.stringify({ error: "Invalid e-mail or password!" }));
        }
    }
    catch(error) {
        console.log(error);
        response.send(JSON.stringify({ error: error }));
    }
});

app.post("/register", async function(request, response) {
    try {
        var result = await auth.createUserAsync(request.body.email, request.body.password, request.body.firstName, request.body.lastName);

        if(!isNull(result) && result === true) {
            response.send(JSON.stringify({ success: true }));
        }
        else {
            response.send(JSON.stringify({ error: "An unknown error occurred!" }));
        }
    }
    catch(error) {
        console.log(error);
        response.send(JSON.stringify({ error: error }));
    }
});

app.get("/amILoggedIn", function(request, response) {
    if(!isNull(request.session) && !isNull(request.session.loggedInAs)) {
        response.send("Yes");
    }
    else {
        response.send("No");
    }
});

app.get("/logout", async function(request, response) {
    try {
        await auth.logoutAsync(request);
    }
    catch(error) {
        console.log(error);
    }
    response.redirect("/");
});

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
