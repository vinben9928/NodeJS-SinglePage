const express = require("express");
const db = require("./modules/db");
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.post("/create", async function(request, response) {
    if(request.todo !== undefined && request.todo !== null) {
        var result = await db.addPostAsync(request.todo, request.meta);

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

app.listen(80, function() {
    console.log("Server is listening on port 80!");
});
