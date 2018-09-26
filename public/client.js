window.addEventListener("DOMContentLoaded", documentLoaded);

function documentLoaded() {
    const menu = elementsByClassName("menu");
    menu.forEach(function(li) {
        li.addEventListener("click",toggleContent);
    });

    const menuButton = document.getElementById("menuButton");
    menuButton.addEventListener("click", toggleMenu);
}

function toggleMenu() {
    let nav = document.getElementsByTagName('nav')[0];
    nav.classList.toggle("hidden");
}

function toggleContent() {
    const menu = elementsByClassName("menu");
    const index =  menu.indexOf(this);

    let content = elementsByClassName("mainContent");

    content.forEach(function(el) {
        el.className = "mainContent";
    });

    content[index].className += " visible";
}

function elementsByClassName(className) {
    if(className === undefined || className === null || typeof className !== "string") { throw "'className' must be a string!"; }
    
    var returnArray = [];
    var elements = document.getElementsByClassName(className);

    for(var i = 0; i < elements.length; i++) {
        returnArray.push(elements[i]);
    }

    return returnArray;
}