let UPLOADING = false;

$(() => {
    GET();
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        let message = $('#d0f9-message');
        let upload = $('#d0f9-upload');

        switch (request.target) {
            case 'uploadMessage':
                message.text(request.message);
                upload.data('uploaded', request.finished);
                upload.data('uploading', !request.finished);
                upload.text(request.status);
                if (!UPLOADING) {
                    UPLOADING = true;
                    let message = $('#d0f9-message');
                    let upload = $('#d0f9-upload');
                    upload.html('<div class="d0f9-loading"/>');
                    upload.css('cursor', 'default');
                    message.show();
                }
                if (request.finished) {
                    setTimeout(() => {
                        message.hide();
                    }, 3000);
                }
                sendResponse();
                break;
        }
    });
});

const GET = function(fetchData = false) {
    let setData;
    if (fetchData) {
        let message = $('#d0f9-message');
        message.text('正在获取数据...');
        message.show();
        UPLOADING = true;
        setData = (data) => {
            console.log(data);
            chrome.runtime.sendMessage({target: "batchUpload", dat: data});
        }
    } else {
        setData = (data) => {
            let body = $('body');
            body.append(`<div class="d0f9-container">
                    <div class="d0f9-content">
                        <div style="color: #ddd;font-size: 14px;line-height: 20px;">主图</div>
                        <div style="font-weight: bold;line-height: 30px;">${data.images.length}</div>
                        <div style="color: #ddd;font-size: 14px;line-height: 20px;">描述</div>
                        <div style="font-weight: bold;line-height: 30px;">${data.detail.length}</div>
                        <div style="color: #ddd;font-size: 14px;line-height: 20px;">视频</div>
                        <div style="font-weight: bold;line-height: 30px;">${data.video ? 'YES' : 'NO'}</div>
                        <div style="font-weight: bold;line-height: 30px;cursor: pointer;">获取</div>
                    </div>
                    <div class="d0f9-upload" id="d0f9-upload">上传</div>
                </div>`);
            body.append('<div class="d0f9-message" id="d0f9-message"/>')
            let upload = $('#d0f9-upload');
            upload.on('click', () => {
                if (upload.data('uploaded')) {
                    window.open('http://192.168.72.166:8889/chrome-ext-goods/html/test.html', '_blank'); //配置上传完成后需要打开的网页完整url,点击完成会打开对应页面,如https://www.test.com
                    return;
                }
                if (upload.data('uploading')) {
                    return;
                }
                upload.html('<div class="d0f9-loading"/>');
                upload.data('uploading', true);
                upload.css('cursor', 'default');
                GET(true);
            });
        }
    }
    if (window.location.href.indexOf('wsy.com/item.htm') !== -1) {
        getData(setData);
    }

    if (window.location.href.indexOf('taobao.com/item.htm') !== -1) {
        getTBData(setData);
    }

    if (window.location.href.indexOf('tmall.com/item.htm') !== -1) {
        $('html, body').animate({
            scrollTop: 150,
        }, 500);
        $('html, body').animate({
            scrollTop: 0
        }, 500);
        getTMData(setData);
    }

    if (window.location.href.indexOf('hznzcn.com/product-') !== -1) {
        getNZData(setData);
    }

    if (window.location.href.indexOf('1688.com/offer/') !== -1) {
        setTimeout(() => getOSEEData(setData), 5000);
    }

    if (window.location.href.indexOf('5ts.com/item.htm') !== -1) {
        getTSData(setData);
    }

    if (window.location.href.indexOf('3e3e.cn/product') !== -1) {
        getSYData(setData);
    }

    if (window.location.href.indexOf('http://192.168.72.166:8889/chrome-ext-goods/html/test.html') !== -1) { //配置要获取数据的url,打开对应地址即可获取数据
        chrome.runtime.sendMessage({target: "getDat"}, function(res) {
            if (!res) {
                return;
            }

            let data = JSON.stringify(res);
            $('body').append(`<div id="ext-data" style="display: none;">${data}</div>`);
        });
    }
};

function getData(setData) {

    setData({
        images: (function() {
            let array = [];
            $('.wsy-gallery').find('ol').find('li').find('a.J_pic_open').each(function() {
                array.push($(this).attr('href'));
            });
            return array.filter(v => {
                return !(!v || v.toString().indexOf('http') !== 0);
            });
        })(),
        detail: (function() {
            let array = [];
            $('.item_b_main').find('img').each(function() {
                array.push($(this).attr('src'));
            });
            return array.filter(v => {
                return !(!v || v.toString().indexOf('http') !== 0);
            });
        })(),
        color: (function() {
            let array = [];
            $('.color').each(function() {
                array.push($(this).text().trim());
            });
            return array;
        })(),
        size: (function() {
            let array = [];
            let parent = '';
            $('.table-sku').find('.s_name').each(function() {
                let p = $(this).parent().data('color');
                if (parent === '') {
                    parent = p;
                }
                if (p === parent) {
                    array.push($(this).text().trim());
                }
            });
            return array;
        })(),
        title: $('.item-mb').find('a').text().trim(),
        price: $('.item-p1').find('em').find('span').eq(0).text().trim(),
        shop: $('.shop-name').text().trim(),
        video: $('.lib-video').attr('src'),
    })
}

function getTBData(setData) {
    let string = $('#J_sidebar_config').next().text();
    let start = string.search(/videoId":/) + 10;
    let end = string.search(/autoplay/) - 3;
    let id = string.substring(start, end);
    let video = '';
    if (parseInt(id)){
        video = 'https://cloud.video.taobao.com/play/u/158748311/p/1/e/6/t/1/' + id + '.mp4';
    }
    setData({
        images: (function() {
            let array = [];
            $('.tb-s50').each(function () {
                let src = $(this).find('img').data().src;
                if (src !== undefined){
                    src = src.replace('_50x50.jpg', '');
                    if (src.indexOf('https://') === 0) {
                        array.push(src);
                    } else {
                        array.push('https:' + src);
                    }
                }
            });
            return array;
        })(),
        detail: (function() {
            let array = [];
            $('#J_DivItemDesc').find('img').each(function () {
                    if ($(this).data().ksLazyload !== undefined){
                        array.push($(this).data().ksLazyload);
                    } else{
                        array.push($(this).attr('src'));
                    }
            });
            return array;
        })(),
        color: (function() {
            let array = [];
            $('.J_Prop_Color').find('dd').find('li').each(function () {
                array.push($(this).find('span').text());
            });
            return array;
        })(),
        size: (function() {
            let array = [];
            $('.J_Prop_measurement').find('dd').find('li').each(function () {
                array.push($(this).find('span').text());
            });
            return array;
        })(),
        title: $('.tb-main-title').data().title,
        price: $('#J_PromoPriceNum').text().trim(),
        shop: $('.tb-shop-name').find('a').attr('title'),
        video: video,
    })
}

function getTMData(setData) {
    setData({
        images: (function() {
            let array = [];
            $('#J_UlThumb').children().each(function () {
                array.push('https:' + $(this).find('img').attr('src').replace('_60x60q90.jpg', ''));
            });
            return array;
        })(),
        detail: (function() {
            let array = [];
            $('.ke-post').find('img').each(function () {
                if ($(this).data().ksLazyload !== undefined && $(this).data().ksLazyload.indexOf('.gif') === -1){
                    array.push($(this).data().ksLazyload);
                } else if ($(this).attr('src') && $(this).attr('src').indexOf('.gif') === -1 &&  $(this).attr('src').indexOf('T1BYd_XwFcXXb9RTPq-90-90.png') === -1 ) {
                    if ($(this).attr('src') && $(this).attr('src').indexOf('http') === -1) {
                        array.push('https:' + $(this).attr('src'));
                    } else {
                        array.push($(this).attr('src'));
                    }
                }
            });
            return array;
        })(),
        color: (function() {
            let array = [];
            $('.tb-img').find('li').each(function () {
                array.push($(this).attr('title'));
            });
            return array;
        })(),
        size: (function() {
            let array = [];
            $('.tb-sku').children().first().find('span').each(function () {
                array.push($(this).text());
            });
            return array;
        })(),
        title: $.trim($('.tb-detail-hd').children().first().text()),
        price: $('.tm-promo-price').find('.tm-price').text().trim(),
        shop: $('.shopLink').text().trim(),
        video: (function() {
            var video = $('.lib-video').find('source').attr('src');
            if (video && video.indexOf('http') === -1) {
                video =  'https:' + video;
            }
            return video;
        })(),
    });
}

function getNZData(setData) {
    setData({
        images: (function() {
            let array = [];
            $('.gallery_selected').each(function() {
                array.push($(this).children().attr('id'));
            });
            return array;
        })(),
        detail: (function() {
            let array = [];
            $('#detail_img').find('img').each(function() {
                array.push($(this).data().original);
            });
            return array;
        })(),
        color: (function() {
            let array = [];
            $('.prop-value-on').each(function() {
                array.push($(this).attr('text'));
            });
            return array;
        })(),
        size: (function() {
            let array = [];
            $('.sizeT').each(function() {
                array.push($(this).text().trim());
            });
            return array;
        })(),
        title: $('.detail-midtitle').find('h1').text().trim(),
        price: $('#productShopPrice').text().trim(),
        shop: $('.LBrandKr-Uzi').find('a').text().trim(),
        video: $('#J_playVideo').attr('videourl'),
    })
}

function getOSEEData(setData) {
    getDetail(function (detail) {
        let arr = [];
        for (let i = 0; i < detail.length; i++) {
            if (detail[i].indexOf('gif') === -1) {
                arr.push(detail[i]);
            }
        }
        setData({
            images: (function() {
                let array = [];
                $('.tab-content-container').find('li').each(function() {
                    if ($(this).data('imgs')) {
                        array.push($(this).data('imgs').original);
                    }
                });
                return array;
            })(),
            detail: arr,
            color: (function() {
                let array = [];
                let list = [$('.vertical-img-title'), $('.text-single-line')];
                for (let i = 0; i < list.length; i++) {
                    if (list[i].eq(0).text()) {
                        list[i].each(function() {
                            array.push($(this).text());
                        });
                        break;
                    }
                }
                return array;
            })(),
            size: (function() {
                let array = [];
                $('.table-sku').find('.name').each(function() {
                    array.push($(this).children().text());
                });
                return array;
            })(),
            title: $('#mod-detail-title').find('h1').text().trim(),
            price: (function () {
                var price = '';
                $('.table-sku').find('.price').each(function() {
                    price = $(this).find('.value').text();
                    return false;
                });
                return price;
            })(),
            shop: $('.nameArea a').text().trim(),
            video: $('video.lib-video').find('source').attr('src') ? $('video.lib-video').find('source').attr('src').replace(/http:/, 'https:') : '',
        });
    });
}

function getTSData(setData) {
    setData({
        images: (function() {
            let array = [];
            $('.imgTabBox').find('li').each(function() {
                array.push($(this).data('img'));
            });
            return array;
        })(),
        detail: (function() {
            let array = [];
            $('.goodsDetail').find('img').each(function() {
                array.push($(this).data('original'));
            });
            return array;
        })(),
        color: (function() {
            let array = [];
            $('.sizes').find('.count').each(function(){
                array.push($(this).data('sizekey'));
            })
            return array;
        })(),
        size: (function() {
            let array = [];
            $('#colorsMetabox').find('span').each(function(){
                array.push($(this).text());
            })
            return array;
        })(),
        title: $('.goodsNo.fc3').text().trim(),
        price: $('.piprice').find('span').text().replace('¥', '').split('~')[0],
        shop: $('.topInfo').find('.shopName').text().trim(),
        video: $('.goodsVideo video').attr('src'),
    })
}

function getSYData(setData) {
    setData({
        images: (function() {
            let array = [];
            $('.small-img-item').each(function() {
                let url = $(this).find('img').attr('big');
                if (url) {
                    array.push(url);
                }
            });
            return array;
        })(),
        detail: (function() {
            let array = [];
            $('.product-details-content').find('img').each(function() {
                array.push($(this).attr('src'));
            });
            return array;
        })(),
        color: (function() {
            let array = [];
            if ($('.sku-warp-li-imgbox').length > 0) {
                $('.sku-warp-li-imgbox').each(function(){
                    array.push($(this).children('img').attr('title'));
                })
            } else {
                $('.color-box').each(function () {
                    array.push($(this).find('.text-color').text());
                })
            }

            return array;
        })(),
        size: (function() {
            let array = [];
            $('.details-attribute-li-size').each(function(){
                array.push($(this).text());
            })
            return array;
        })(),
        title: $('.product-details').find('.ft-bold').text(),
        price: $(".price-content").children(":first").text().replace(/(^￥)|( -$)/g,''),
        shop: $('.supplier-name').find('a').text(),
        video: $('#video-flv').attr('src'),
    })
}

function getDetail(callback) {
    let url = $('.desc-lazyload-container').data('tfs-url');
    $.get(url, function (response) {
        callback(Array.from(response.matchAll(/src=\\"(.+?)\\"/g), m => m[1]));
    });
}

function blobToDataURL(blob, callback) {
    var a = new FileReader();
    a.onload = function (e) { callback(e.target.result); }
    a.readAsDataURL(blob);
}

function fetchBlob(data) {
    fetch(data.video).then(res => res.blob()).then(res => {
        blobToDataURL(res, function (result) {
            if (data.video.length){
                data.video1 = result;
            }
        });
    });
}
