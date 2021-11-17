let data = undefined;
const CANVAS = document.createElement('canvas');
const CANVAS_CONTEXT = CANVAS.getContext('2d');
const IM = import(chrome.extension.getURL('/js/image.js')).then(res => res.default().then(() => res));
// 消息处理
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    console.log('Received target \'' + request.target + '\' by ' + sender.id);

    switch (request.target) {
        case 'getDat':
            sendResponse(data);
            break;
        case 'setDat':
            data = request.dat;
            sendResponse();
            break;
        case 'cleanDat':
            data = undefined;
            sendResponse();
            break;
        case 'batchUpload':
            data = request.dat;
            let i = 0;
            let images = [...data.images, ...data.detail];
            if (data.video) {
                images.push(data.video);
            }
            try {
                for (i=0; i<images.length; i++) {
                    await uploadResource(images[i]);
                    let message = '上传 ' + (i + 1) + ' / ' + images.length;
                    let status = undefined;
                    let finished = false;
                    if (i + 1 === images.length) {
                        message = '上传成功';
                        status = '完成';
                        finished = true;
                    }
                    // console.log(i);
                    chrome.tabs.sendMessage(sender.tab.id, {target: 'uploadMessage', message: message, status: status, finished: finished});
                }
            } catch (e) {
                // console.log(images[i]);
                // console.error(e);
                chrome.tabs.sendMessage(sender.tab.id, {target: 'uploadMessage', message: '第' + (i+1) + '张上传失败', status: '上传', finished: false});
            }
            sendResponse();
            break;
    }
});


chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        sendResponse();
    });

function toBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(resolve, 'image/jpeg');
    });
}

async function uploadResource(images, tabId) {
    return new Promise((resolve, reject) => {
        fetch(images).then(res => res.blob()).then(res => {
            if (res.type.indexOf('image') !== -1) {
                const image = new Image;
                image.src = window.URL.createObjectURL(res);
                image.onload = () => {
                    CANVAS.width = image.width > 800 ? 800 : image.width;
                    CANVAS.height = image.width > 800 ? (image.height * (800 / image.width)) : image.height;
                    const context = CANVAS.getContext('2d');
                    context.drawImage(image, 0, 0, image.width, image.height, 0, 0, CANVAS.width, CANVAS.height);
                    if (CANVAS.width * 3 < CANVAS.height) {
                        IM.then(res => res.image_split_area)
                            .then(split => split(
                            CANVAS_CONTEXT.getImageData(0, 0, CANVAS.width, CANVAS.height).data,
                            CANVAS.width,
                            CANVAS.height).data
                        ).then(async slice => {
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            const uploads = [];

                            for (let s of slice) {
                                canvas.width = CANVAS.width;
                                canvas.height = s[1] - s[0];
                                context.putImageData(CANVAS_CONTEXT.getImageData(0, s[0], CANVAS.width, canvas.height), 0, 0);
                                console.log('slice', s);
                                await toBlob(canvas).then((blob) => {
                                    return UPLOAD(blob)
                                }).then(url => {
                                    uploads.push(url);
                                })
                            }

                            data.images = data.images.reduce((a, b) => {
                                if (b === images) {
                                    a = [...a, ...uploads];
                                } else {
                                    a.push(b);
                                }
                                return a;
                            }, []);
                            data.detail = data.detail.reduce((a, b) => {
                                if (b === images) {
                                    a = [...a, ...uploads];
                                } else {
                                    a.push(b);
                                }
                                return a;
                            }, []);
                            resolve(true);
                        }).catch(e => {
                            reject(Error("多图上传报错:" + e.message));
                            // message.text(e.message);
                            // upload.data('uploading', false);
                            // upload.text('上传');
                        });
                    } else {
                        CANVAS.toBlob((blob) => {
                            UPLOAD(blob).then(url => {
                                data.images = data.images.map(v => {
                                    if (v === images) {
                                        return url;
                                    } else {
                                        return v;
                                    }
                                });
                                data.detail = data.detail.map(v => {
                                    if (v === images) {
                                        return url;
                                    } else {
                                        return v;
                                    }
                                });
                                resolve(true);
                            }).catch(e => {
                                reject(false);
                                // message.text(e.message);
                                // upload.data('uploading', false);
                                // upload.text('上传');
                            });
                        }, 'image/jpeg');
                    }
                }
            } else if (res.type.indexOf('video') !== -1) {
                UPLOAD(res).then(url => {
                    data.video = url;
                    resolve(true);
                }).catch(e => {
                    reject(false);
                    // message.text(e.message);
                    // upload.data('uploading', false);
                    // upload.text('上传');
                });
            }
        }).catch((e) => {
            reject(e.message);
        });


    })
}

const UPLOAD = (blob) => {
    let bucket = blob.type.indexOf('video') === 0 ? 'video' : 'image';
    let prefix = {
        'video': '', //视频上传地址,如:http://www.video.com/
        'image': '', //图片上传地址,如:http://www.image.com/
    };
    let token = {
        'video': '',//视频上传token
        'image': '',//图片上传token
    };

    return new Promise((resolve, reject) => {
        let ext = '';
        switch (blob.type) {
            case 'image/jpeg':
                ext = '.jpg';
                break;
            case 'image/gif':
                ext = '.gif';
                break;
            case 'image/png':
                ext = '.png';
                break;
            case 'image/webp':
                ext = '.webp';
                break;
            case 'image/bmp':
                ext = '.bmp';
                break;
            case 'video/mp4':
                ext = '.mp4';
                break;
        }
        IM.then(res => res.md5)
            .then(md5 => blob.arrayBuffer()
                .then(buffer => new Uint8Array(buffer))
                .then(u8 => md5(u8)))
            .then(hash => {
                let form = new FormData;
                form.append('token', token[bucket]);
                form.append('file', blob);
                form.append('key', hash + ext);
                fetch('https://up.qiniup.com/', {
                    method: 'POST',
                    body: form,
                })
                    .then(res => res.json())
                    .then(res => {
                        resolve(prefix[bucket] + res.key);
                    }).catch(e => {
                    console.log(e);
                    reject(new Error('上传失败'));
                });
            })
    });
}