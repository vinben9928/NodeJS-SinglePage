const __posts = [];
var __editingId = null;

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

        response.posts.reverse();

        var element = document.getElementById("posts");
        for(var i = 0; i < response.posts.length; i++) {
            var post = response.posts[i];
            var timestamp = new Date(post.timestamp);
            
            var postObj = { id: post.id, data: post.data, timestamp: post.timestamp };

            var postElement = document.createElement("div");
            postElement.className = "post";
            
            var dateElement = document.createElement("h1");
            dateElement.innerText = formatDate(timestamp);

            var textElement = document.createElement("p");
            textElement.innerHTML = post.data;

            var deleteElement = document.createElement("div");
            deleteElement.classList.add("deleteButton");
            deleteElement.classList.add("noselect");
            deleteElement.innerHTML = "&times;";

            var editElement = document.createElement("a");
            editElement.className = "editLink";
            editElement.href = "javascript:void(0);";
            editElement.innerText = "edit";

            const id = post.id;

            deleteElement.addEventListener("click", function() {
                $.post("/delete", { id: id }, function(data) {
                    try {
                        var response = JSON.parse(data);
                        if(response.error !== undefined && response.error !== null) {
                            alert(response.error);
                        }

                        if(response.success !== undefined && response.success === true) {
                            window.location.reload(true);
                        }
                        else {
                            throw "<error>";
                        }
                    }
                    catch(error) {
                        alert("Invalid response received from server!");
                    }
                });
            });

            editElement.addEventListener("click", function() {
                editPost(id);
            });

            postElement.appendChild(editElement);
            postElement.appendChild(deleteElement);
            postElement.appendChild(dateElement);
            postElement.appendChild(textElement);

            if(post.meta !== undefined && post.meta !== null && 
                post.meta.tags !== undefined && post.meta.tags !== null && 
                 Array.isArray(post.meta.tags)) {
                
                postObj.tags = post.meta.tags;
                
                var tagsString = "";
                for(var t = 0; t < post.meta.tags.length; t++) {
                    tagsString += post.meta.tags[t] + (t < post.meta.tags.length - 1 ? " | " : "");
                }

                var tagsElement = document.createElement("p");
                tagsElement.className = "tagsDisplay";
                tagsElement.innerText = tagsString;

                postElement.appendChild(tagsElement);
            }

            __posts.push(postObj);
            element.appendChild(postElement);
        }
    });
}

function post() {
    var tags = [];
    var tagElements = document.getElementsByClassName("postTag");
    for(var i = 0; i < tagElements.length; i++) {
        tags.push($(tagElements[i]).val());
    }

    $.post("/create", { post: $("#postData").val(), meta: { tags: tags } }, function(data) {
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
    });
}

function addTag(value) {
    if(value === undefined || value === null || typeof value !== "string") { value = ""; }

    var tagElement = document.createElement("input");
    tagElement.className = "postTag";
    tagElement.setAttribute("value", value);

    document.getElementById("tagContainer").appendChild(tagElement);
}

function clearTags() {
    var node = document.getElementById("tagContainer");
    while(node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function editPost(id) {
    if(id === undefined || id === null || typeof id !== "number") { throw "'id' must be a valid, whole number!"; }
    
    var textArea = document.getElementById("postData");
    var tags = document.getElementsByClassName("postTag");

    if((textArea.value !== null && textArea.value.length > 0) || tags.length > 0) {
        if(!confirm("You are already editing a post...\nDo you want to discard the changes?")) {
            return;
        }
    }

    var post = getPostById(id);
    if(post !== null) {
        alert("ERROR: Post not found!");
        return;
    }

    __editingId = id;
    textArea.value = post.data;

    clearTags();
    
    if(post.tags !== undefined && post.tags !== null) {
        for(var i = 0; i < post.tags.length; i++) {
            addTag(post.tags[i]);
        }
    }
}

function getPostById(id) {
    if(id === undefined || id === null || typeof id !== "number") { throw "'id' must be a valid, whole number!"; }

    for(var i = 0; i < __posts.length; i++) {
        if(__posts[i].id == id) {
            return __posts[i];
        }
    }

    return null;
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