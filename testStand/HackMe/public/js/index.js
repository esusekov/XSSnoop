var tests = document.querySelectorAll('.test-item');
var results = document.querySelectorAll('.result-item');
var navs = document.querySelectorAll('.nav-item');

var activeTestIndex = 0;

function fadeIn(element) {
    element.classList.add('fadein');
    element.classList.remove('fadeout');
}

function fadeOut(element) {
    element.classList.add('fadeout');
    element.classList.remove('fadein');
}

function makeTestVisible(index) {
    fadeIn(tests[index]);
    fadeIn(results[index]);
}

function makeTestHidden(index) {
    if (activeTestIndex !== index) {
        fadeOut(tests[index]);
        fadeOut(results[index]);
    }
}

function makeTestActive(index) {
    fadeOut(tests[activeTestIndex]);
    fadeIn(tests[index]);
    fadeOut(results[activeTestIndex]);
    fadeIn(results[index]);
    activeTestIndex = index;
}

function routeToTest() {
    if (location.hash === '') {
        makeTestActive(0);
        return;
    }
    var routedIndex;
    Array.prototype.some.call(tests, function(test, index) {
        routedIndex = index;
        return '#'+test.id === location.hash;
    });
    makeTestActive(routedIndex);
}

Array.prototype.forEach.call(tests, function(test) {

});

Array.prototype.forEach.call(navs, function(nav, index) {
    nav.addEventListener('mouseover', function() {
        makeTestVisible(index);
    });

    nav.addEventListener('mouseleave', function() {
        makeTestHidden(index);
    });

    nav.addEventListener('click', function() {
        makeTestActive(index);
    });
});

window.onhashchange = routeToTest;

routeToTest();


function Card(title, content) {
    this.title = title;
    this.content = content;
}

Card.prototype = {
    render: function(parentNode) {
        var node =
            '<div class="card-item">' +
                '<div class="card-title">'+ this.title +'</div>' +
                '<div class="card-content">'+ this.content +'</div>' +
            '</div>';
        console.log(node);
        parentNode.innerHTML += node;
    }
};

document.querySelector('.basic-form').onsubmit=createBasicCard;

function createBasicCard(event) {
    event.preventDefault();
    var form = this;

    var elements = form.elements;
    var card = new Card(elements['title'].value, elements['content'].value);

    card.render(results[0]);
    form.reset();
    return false;
}