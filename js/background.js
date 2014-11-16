function sendMessage(message) {
    chrTabs.query(
        {windowId: -2, active: true},
        function (tabs) {
            var port = chrTabs.connect(tabs[0].id);
            port.postMessage(message);
        }
    )
}

function createFormsList(formsStrings) {
    formsList = Array.prototype.map.call(formsStrings, function(formString) {
        return {
            formString: formString,
            status: formStatuses.WAITING
        }
    });
    formsList[0].status = formStatuses.INPROGRESS;
}

function fillFormWithXSS(index) {
    sendMessage({
        sender: 'background',
        recipient: 'content-script',
        action: 'fillForm',
        data: {
            formIndex: index
        }
    });

    setTimeout(function() {
        sendMessage({
            sender: 'background',
            recipient: 'content-script',
            action: 'checkVulnerability',
            data: {
                formIndex: index
            }
        });
    }, 2000);
}


function messageHandler(message) {
    console.log(message);
    console.log('in message handler', counter, finish);
    if (message.recipient === 'content-script') {
        sendMessage(message);
    }

    if (message.recipient === 'background') {
        if (message.action === 'saveForms') {
            createFormsList(message.data.formsStrings);
            formsCount = message.data.formsCount;
            testingUrl = message.data.pageUrl;
            finish = formsCount;
            fillFormWithXSS(counter);
        }

        if (message.action === 'formReport') {
            console.log('in form report', counter, finish);
            formsList[counter].status = message.data.status;
            counter++;
            if (counter !== finish) {
                sendMessage({
                    sender: 'background',
                    recipient: 'content-script',
                    action: 'refreshPage',
                    data: {
                        pageUrl: testingUrl
                    }
                });
            } else {
                counter = 0;
            }
        }

        if (message.action === 'pageLoaded') {
            console.log('in page loaded', counter, finish);
            if (counter !== 0 && formsList[counter].status !== formStatuses.INPROGRESS) {
                formsList[counter].status = formStatuses.INPROGRESS;
                fillFormWithXSS(counter);
            }
        }
    }
}

var chrTabs = chrome.tabs;
var chrRuntime = chrome.runtime;

var formStatuses = {
    INPROGRESS: 'inprogress',
    WAITING: 'waiting',
    VULNERABLE: 'vulnerable',
    SAFE: 'safe'
};

var port = chrRuntime.connect();
var formsCount;
var formsList = [];
var counter = 0;
var testingUrl;
var finish;

chrRuntime.onConnect.addListener(function (port) {
    port.onMessage.addListener(messageHandler);
});
