function sendMessage(message) {
    chrTabs.query(
        {windowId: -2, active: true},
        function (tabs) {
            var port = chrTabs.connect(tabs[0].id);
            port.postMessage(message);
        }
    )
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
        //waitForSiteResponse


        //checkIfVulnerable


function messageHandler(message) {
    console.log(message);

    if (message.recipient === 'content-script') {
        sendMessage(message);
    }

    if (message.recipient === 'background') {
        if (message.action === 'saveForms') {
            formsList = message.data.formsList;
            formsCount = message.data.formsCount;
            finish = formsCount - 1;
            fillFormWithXSS(counter);
        }
    }
}

var chrTabs = chrome.tabs;
var chrRuntime = chrome.runtime;

var port = chrRuntime.connect();
var formsCount;
var formsList = [];
var counter = 0;
var finish;

chrRuntime.onConnect.addListener(function (port) {
    port.onMessage.addListener(messageHandler);
});
