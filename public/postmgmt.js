window.addEventListener("DOMContentLoaded", documentLoaded);

function documentLoaded() {
    $.post("/getPosts", function(data) {
        var response = null;

        try {
            response = JSON.parse(data);
            if(response === null) { throw "<error>"; }
            
            if(response.error !== undefined && response.error !== null) {
                alert(response.error.toString());
                throw "<error>";
            }

            if(response.posts === null || !Array.isArray(response.posts)) { throw "<error>"; }
        }
        catch(error) {
            document.getElementById("posts").innerHTML = "<h1>Invalid response received from server!</h1>";
            return;
        }

        var element = document.getElementById("posts");
        for(var i = 0; i < response.posts.length; i++) {
            var post = response.posts[i];
            var timestamp = new Date(post.timestamp);

            var postElement = document.createElement("div");
            postElement.className = "post";
            
            var dateElement = document.createElement("h1");
            dateElement.innerText = formatDate(timestamp);

            var textElement = document.createElement("p");
            textElement.innerText = post.data;

            postElement.appendChild(dateElement);
            postElement.appendChild(textElement);

            element.appendChild(postElement);
        }
    });
}

function post() {
    $.post("/create", { post: $("#postData").val() }, function(data) {
        try {
            var response = JSON.parse(data);
            if(response === null) { throw "<error>"; }
            
            if(response.error !== undefined && response.error !== null) {
                alert(response.error.toString());
                return;
            }
            
            if(response.success !== undefined && response.success === true) {
                window.location.reload(true);
            }
        }
        catch(error) {
            alert("Invalid response received from server!");
        }
    })
}

function formatDate(date) {
    if(Object.prototype.toString.call(date) !== "[object Date]") { throw "Input must be a valid Date!"; }
    return date.getFullYear() + "-" + formatNumber(date.getMonth() + 1) + "-" + formatNumber(date.getDate()) + "  " + 
            formatNumber(date.getHours()) + ":" + formatNumber(date.getMinutes()) + ":" + formatNumber(date.getSeconds());
}

function formatNumber(num) {
    if(typeof num !== "number") { throw "Input must be a valid number!"; }
    return (num >= 0 && num <= 9 ? "0" + num.toString() : num.toString());
}