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
    formsList = formsStrings.map(function(formString) {
        return {
            formString: formString,
            status: formStatuses.WAITING,
            reports: []
        }
    });
    formsList[0].status = formStatuses.INPROGRESS;
}

function getFormStatus(formIndex) {
    var isVulnerable = formsList[formIndex].reports.some(function(report) {
        return report.vulnerable;
    });
    return isVulnerable ? 'vulnerable' : 'safe';
}

function logReport() {
    var result = {};
    console.log('in log report');
    formsList.forEach(function(formData, index) {
        var form = result[formData.formString + index] = {};
        formData.reports.forEach(function(report) {
            form[report.xssString] = report.vulnerable;
        });
    });

    console.log( formsList, result);
    console.table(result);
}

function fillFormWithXSS(formIndex, xssIndex) {
    sendMessage({
        sender: 'background',
        recipient: 'content-script',
        action: 'fillForm',
        data: {
            formIndex: formIndex,
            xssIndex: xssIndex
        }
    });

    checkVulTimeout = setTimeout(function() {
        sendMessage({
            sender: 'background',
            recipient: 'content-script',
            action: 'checkVulnerability',
            data: {
                formIndex: formIndex,
                xssIndex: xssIndex
            }
        });
    }, 3000);
}

function messageHandler(message) {
    console.log(message);
    console.log('in message handler', formCounter, finish);
    if (message.recipient === 'content-script') {
        if (message.action === 'scanPage') {
            formsCount = 0;
            formsList = [];
            formCounter = 0;
            xssCounter = 0;
            testingUrl = '';
            finish = 0;
            clearTimeout(checkVulTimeout);
        }
        sendMessage(message);
    }

    if (message.recipient === 'background') {

        switch (message.action) {
            case 'saveForms':
                createFormsList(message.data.formsStrings);
                formsCount = message.data.formsCount;
                testingUrl = message.data.pageUrl;
                finish = formsCount;
                fillFormWithXSS(formCounter, xssCounter);
                break;

            case 'xssReport':
                formsList[formCounter].reports.push(message.data.report);
                xssCounter++;
                sendMessage({
                    sender: 'background',
                    recipient: 'content-script',
                    action: 'refreshPage',
                    data: {
                        pageUrl: testingUrl
                    }
                });
                break;

            case 'lastXssReport':
                console.log('in last xss report', formCounter, finish);
                formsList[formCounter].reports.push(message.data.report);
                formsList[formCounter].status = getFormStatus(formCounter);
                formCounter++;
                xssCounter = 0;
                if (formCounter !== finish) {
                    sendMessage({
                        sender: 'background',
                        recipient: 'content-script',
                        action: 'refreshPage',
                        data: {
                            pageUrl: testingUrl
                        }
                    });
                } else {
                    logReport();
                    formCounter = 0;
                    formsList = [];
                }
                break;

            case 'pageLoaded':
                console.log('in page loaded', formCounter, xssCounter, finish);
                if (formCounter !== 0 || xssCounter !== 0) { //TODO - то что внутри не должно срабатывать, если событие page loaded произошло после сабмита xss, кроме случая, когда это последний xss
                    formsList[formCounter].status = formStatuses.INPROGRESS;
                    fillFormWithXSS(formCounter, xssCounter);
                }
                break;
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
var formCounter = 0;
var xssCounter = 0;
var testingUrl;
var finish;
var checkVulTimeout;

chrRuntime.onConnect.addListener(function (port) {
    port.onMessage.addListener(messageHandler);
});
