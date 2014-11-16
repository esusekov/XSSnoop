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
    var flag = Array.prototype.some.call(tests, function(test, index) {
        routedIndex = index;
        return '#'+test.id === location.hash;
    });
    if (flag) {
        makeTestActive(routedIndex);
    }
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

function safe_tags(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') ;
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
    },
    escape: function() {
        this.title = safe_tags(this.title);
        this.content = safe_tags(this.content);
    }
};

var basicForms = document.querySelectorAll('.basic-form');
basicForms[0].onsubmit = createBasicCard;
basicForms[1].onsubmit = createBasicCardWithEscaping;

function createBasicCard(event, escaping) {
    event.preventDefault();
    var form = this;

    var elements = form.elements;
    var card = new Card(elements['title'].value, elements['content'].value);

    if (escaping) {
        card.escape();
    }

    card.render(results[0]);
    form.reset();
    return false;
}

function createBasicCardWithEscaping(event) {
    event.preventDefault();
    var form = this;

    var elements = form.elements;
    var card = new Card(elements['title'].value, elements['content'].value);

    card.escape();
    card.render(results[0]);
    form.reset();
    return false;
}