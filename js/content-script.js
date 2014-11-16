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
        form.dispatchEvent(new Event('submit'));
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
                formsList: formsStrings,
                pageUrl: location.href
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

            }
        }

    }

    var chrRuntime = chrome.runtime;

    var scanner = new Scanner();
    var port = chrRuntime.connect();

    var xssString = 'ZZZ <script>window.evil=true;console.error(\'YOU ARE HACKED\');</script>';
    var imgString = '<img src="empty.gif" onerror="window.evil=true;console.error(\'YOU ARE HACKED\');" />';
    var buttonString = '<button onclick="window.evil=true;console.error(\'YOU ARE HACKED\');">EVIL</button>';

    chrRuntime.onConnect.addListener(function (port) {
        port.onMessage.addListener(messageHandler);
    });

})(Zepto);