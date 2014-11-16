(function($) {

    function Scanner() {

    }

    function fillForm(index) {
        var form = document.forms[index];
        var inputs = form.getElementsByTagName('input');
        var inputs_size = inputs.length;
        for (var i = 0; i < inputs_size; i++) {
            var input = inputs.item(i);
            if (input.type === 'text') {
                input.value = imgString;
            }
        }
        //form.dispatchEvent(new Event('submit')); //для стенда
        form.submit(); //в бою)
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

    function checkVulnerability() {
        var status = location.hash === '#EVIL' ? 'vulnerable' : 'safe';
        sendMessage({
            sender: 'content-script',
            recipient: 'background',
            action: 'formReport',
            data: {
                status: status
            }
        });
    }

    function messageHandler(message) {
        console.log(message);
        if (message.recipient === "content-script") {

            switch (message.action) {
                case 'scanPage':
                    scanPage();
                    break;

                case 'fillForm':
                    fillForm(message.data.formIndex);
                    break;

                case 'checkVulnerability':
                    checkVulnerability();
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

    var xssString = 'ZZZ <script>location.hash=\'EVIL\';console.error(\'YOU ARE HACKED\');</script>';
    var imgString = '<img src="empty.gif" onerror="location.hash=\'EVIL\';console.error(\'YOU ARE HACKED\');" />';
    var buttonString = '<button onclick="location.hash=\'EVIL\';console.error(\'YOU ARE HACKED\');">EVIL</button>';

    chrRuntime.onConnect.addListener(function (port) {
        port.onMessage.addListener(messageHandler);
    });

    sendMessage({
        sender: 'content-script',
        recipient: 'background',
        action: 'pageLoaded'
    });

})(Zepto);