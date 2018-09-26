window.addEventListener("DOMContentLoaded", documentLoaded);

function documentLoaded() {
    $.post("/getPosts", function(data) {
        try {
            var response = JSON.parse(data);
            if(response === null || response.posts === null || !Array.isArray(response.posts)) { throw "<error>"; }

            var element = document.getElementById("posts");
            for(var i = 0; i < response.posts.length; i++) {
                var post = response.posts[i];

                var postElement = document.createElement("div");
                postElement.className = "post";
                
                var dateElement = document.createElement("h1");
                dateElement.innerText = post.timestamp;

                var textElement = document.createElement("p");
                textElement.innerText = post.data;

                postElement.appendChild(dateElement);
                postElement.appendChild(textElement);

                element.appendChild(postElement);
            }
        }
        catch(error) {
            document.getElementById("posts").innerHTML = "<h1>Invalid response received from server!</h1>";
        }
    });
}