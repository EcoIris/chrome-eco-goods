$(document).on('click', 'div.checkbox', function() {
    $(this).toggleClass('checked');
});

$(function() {

    let table = $('#table');

    // 获取数据
    chrome.storage.local.get('dat', function(res) {
        /**
         *
         <tr>
         <td><div class="checkbox"></div></td>
         <td>1</td>
         <td>2</td>
         <td>234567889192</td>
         <td>男衣邦2018时尚潮搭卫衣</td>
         <td>电商</td>
         <td>A092-1</td>
         <td>X8888</td>
         <td>黑色</td>
         <td>XXL</td>
         <td>35</td>
         <td>2</td>
         <td>456</td>
         <td>3</td>
         <td>208120622512618725</td>
         <td>2018-09-15 19:34:07</td>
         <td></td>
         </tr>

         */

        if (!res.dat || !res.dat.length) {
            return;
        }

        let html = '';
        let i = 1;
        res.dat.forEach(item => {
            item.orders.forEach(order => {
                order.items.forEach(goods => {
                    let spec = goods.sku.split(';');
                    html += `
<tr>
    <td><div class="checkbox"></div></td>
    <td>${i}</td>
    <td></td>
    <td><a target="_blank" href="https://item.taobao.com/item.htm?id=${goods.id}">${goods.id}</a></td>
    <td></td>
    <td></td>
    <td></td>
    <td>${spec[0].split(':')[1]}</td>
    <td>${spec[1].split(':')[1]}</td>
    <td></td>
    <td>${goods.num}</td>
    <td></td>
    <td>${order.items.length}</td>
    <td>${order.sn}</td>
    <td></td>
    <td>${goods.number}</td>
</tr>
`;
                    i++;
                });
            });
        });

        table.find('tbody').html(html);

    });



});