# chrome-eco-goods 谷歌浏览器拓展程序

## 可抓取淘宝、天猫、1688、网商园、杭州女装网、童装网和生意网商品信息
## 核心文件
- main.js 处理商品详情
- background.js 上传商品和视频
## 配置
### js/background.js中有七牛云的配置,目前仅支持七牛云,分为图片地址和视频地址
```
let bucket = blob.type.indexOf('video') === 0 ? 'video' : 'image';
let prefix = {
    'video': '', //视频上传地址,如:http://www.video.com/
    'image': '', //图片上传地址,如:http://www.image.com/
};
let token = {//七牛云token
    'video': '',//视频上传token
    'image': '',//图片上传token
};
```
# 使用  
1.将项目装入谷歌浏览器拓展程序中并打开

2.打开对应的网站进入商品详情页面即可看到插件

3.点击上传会先将图片和视频资源上传到七牛云,在你的页面中加入下面的代码即可获取所有抓取到的资源,包括店铺名称、商品名称、尺码、颜色、价格、商品主图、商品描述和视频(参考演示文件:html/test.html)
```
let ele = document.getElementById('ext-data');
if (!ele || ele.innerText === '{}') {
   alert('数据不存在，请刷新后再试');
}
const data = JSON.parse(ele.innerText);
console.log(data);
```
- [更详细的使用步骤](https://www.cnblogs.com/52lnamp/p/15567899.html)