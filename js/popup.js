$(function() {
    console.log('Popup is startup.');

    let ele = {
        upload: $('#upload'),
        get: $('#get'),
        message: $('#message'),
        main: $('#main'),
        detail: $('#detail'),
        name: $('#name'),
    };

    function message(text) {
        clearTimeout(message.timer);

        ele.message.html(`<div>${text}</div>`);
        message.timer = setTimeout(() => {
            ele.message.html('');
        }, 3000);
    }


    ele.upload.on('click', function() {
        chrome.tabs.create({url: 'http://mgt.shruomei.cn/mall/single-add?from=ext_wsy'}, function(tab) {
            // chrome.tabs.executeScript(tab.id, {file: 'js/test.js'});
        });
        // chrome.tabs.create({url: 'http://cms.local/mall/single-add?from=ext_wsy'}, function(tab) {
        //     // chrome.tabs.executeScript(tab.id, {file: 'js/test.js'});
        // });
    });

    ele.get.on('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {type: 'getData'}, function(response) {
                update();
            });
        })
    });

    update();

    function update() {
        chrome.extension.sendMessage({target: "getDat"}, function(res) {
            if (!res) {
                return;
            }
            ele.main.text(res.images ? res.images.length : 0);
            ele.detail.text(res.detail ? res.detail.length : 0);
            ele.name.text(res.title ? res.title : '无法获取');
        });
    }
});

