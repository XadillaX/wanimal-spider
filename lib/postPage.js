/**
 * Created by XadillaX on 2014/6/18.
 */
var async = require("async");
var spidex = require("spidex");
var imgGetter = require("./imgGetter");

function parsePost(html, task) {
    var object = {};
    var regExp1 = /(\d+)-(\d+)-(\d+)<\/a> <span class="hotcount">/;
    var date = regExp1.exec(html);
    if(!date || date.length !== 4) {
        console.log("× 文章 [" + task.task.url + "] 日期获取失败.");
        object.year = 1970;
        object.month = 1;
        object.day = 1;
    } else {
        object.year = parseInt(date[1]);
        object.month = parseInt(date[2]);
        object.day = parseInt(date[3]);
    }

    object.list = [];

    // 获取图片内容区域
    var contentRegExp = /<div id="main">([\s\S]*)<div class="txt">/;
    var contentResult = contentRegExp.exec(html);
    if(!contentResult || contentResult.length !== 2) {
        console.log("× 文章 [" + task.task.url + "] 内容解析失败.");
        return object;
    }

    html = contentResult[1];
    var imgRegExp1 = /<img src="(.*?)"/g;
    var imgRegExp2 = /<img src="(.*?)"/;
    var imgResult = html.match(imgRegExp1);
    if(!imgResult || !imgResult.length) return object;

    for(var i = 0; i < imgResult.length; i++) {
        var temp = imgRegExp2.exec(imgResult[i]);
        if(temp.length !== 2) continue;
        object.list.push(temp[1]);
    }

    return object;
}

function get(task) {
    async.waterfall([
        function(callback) {
            spidex.get(task.task.url, {
                accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "accept-langugage": "zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4,sv;q=0.2,zh-TW;q=0.2",
                "cache-control": "max-age=0",
                connection: "keep-alive",
                host: "wanimal.lofter.com",
                referer: task.task.referer,
                "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36"
            }, function(html, status) {
                if(status !== 200) {
                    callback(new Error("服务器返回错误的状态码。"));
                    return;
                }

                callback(null, html);
            }).on("error", callback);
        },

        function(html, callback) {
            var object = parsePost(html, task);
            callback(null, object);
        }
    ], function(err, object) {
        if(err) {
            console.log("× 文章 [" + task.task.url + " ] 抓取错误：" + err.message);

            // 重新push
            task.task.queue.push(task.task, get);
            task.task.queue.taskDone(task, true);
            return;
        }

        console.log("√ 抓取了 [{year}-{month}-{day}] 的文章 {count} 张图片地址.".assign({
            year        : object.year,
            month       : object.month,
            day         : object.day,
            count       : object.list.length
        }));

        for(var i = 0; i < object.list.length; i++) {
            task.task.queue.push({
                year    : object.year,
                month   : object.month,
                url     : object.list[i],
                queue   : task.task.queue,
                referer : task.task.url
            }, imgGetter.get);
        }

        task.task.queue.taskDone(task, true);
    });
}

exports.get = get;
