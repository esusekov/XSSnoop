function Scanner() {

    }

function fillForm(formIndex, xssIndex) {
    var form = document.forms[formIndex];
    var inputs = form.elements;
    var button;
    Array.prototype.forEach.call(inputs, function(input) {
        switch (input.type) {
            case 'text':
            case 'password':
            case 'search':
                input.value = xssArray[xssIndex].xssString;
                break;
            case 'date':
            case 'datetime':
            case 'datetime-local':
                input.value = '2012-12-12';
                break;
            case 'checkbox':
            case 'radio':
                input.checked = true;
                break;
            case 'email':
                input.value = 'evil@evil.evil';
                break;
            case 'url':
                input.value = 'http://evil.com';
                break;
            case 'reset':
                break;
            case 'submit':
            case 'button':
                button = input;
                break;
            default:
                input.value = xssArray[xssIndex].xssString;
                break;
        }
    });
    var hostname = location.hostname;
    if (button) {
        button.dispatchEvent(new Event('click'));
        return;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        form.dispatchEvent(new Event('submit')); //для стенда
    } else {
        form.submit(); //в бою)
    }
}

function sendMessage(message) {
    port.postMessage(message);
}

function scanPage() {
    var forms = document.forms;
    var formsStrings = Array.prototype.map.call(forms, function(form) {
        return "id=" + form.id + ';name=' + form.name + ';classList=' +form.className;
    });
    sendMessage({
        sender: 'content-script',
        recipient: 'background',
        action: 'saveForms',
        data: {
            formsCount: document.forms.length,
            formsStrings: formsStrings,
            pageUrl: location.href
        }
    });
}

function checkVulnerability(xssIndex) {
    var status = !!eval(xssArray[xssIndex].result);
    console.log(status);
    if (xssIndex !== xssArray.length - 1) {
        sendMessage({
            sender: 'content-script',
            recipient: 'background',
            action: 'xssReport',
            data: {
                report: {
                    xssString: xssArray[xssIndex].xssString,
                    vulnerable: status
                }
            }
        });
    } else {
        sendMessage({
            sender: 'content-script',
            recipient: 'background',
            action: 'lastXssReport',
            data: {
                report: {
                    xssString: xssArray[xssIndex].xssString,
                    vulnerable: status
                }
            }
        });
    }

}

function messageHandler(message) {
    console.log(message);
    if (message.recipient === "content-script") {

        switch (message.action) {
            case 'scanPage':
                scanPage();
                break;

            case 'fillForm':
                xssArray = message.data.xssArray;
                fillForm(message.data.formIndex, message.data.xssIndex);
                break;

            case 'checkVulnerability':
                xssArray = message.data.xssArray;
                checkVulnerability(message.data.xssIndex);
                break;

            case 'refreshPage':
                window.open(message.data.pageUrl, '_self');
                break;
        }
    }

}

var chrRuntime = chrome.runtime;

var scanner = new Scanner();
var port = chrRuntime.connect();

var xssArray;


chrRuntime.onConnect.addListener(function (port) {
    port.onMessage.addListener(messageHandler);
});


//document.addEventListener("DOMContentLoaded", function(event) {
    sendMessage({
        sender: 'content-script',
        recipient: 'background',
        action: 'pageLoaded'
    });
//});



