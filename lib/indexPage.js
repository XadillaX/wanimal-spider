/**
 * Created by XadillaX on 2014/6/18.
 */
var spidex = require("spidex");
var postPage = require("./postPage");
var indexBaseUrl = "http://wanimal.lofter.com/";
var cheerio = require("cheerio");
var queryString = require("querystring");

function get(task) {
    var url = task.task.url;
    var page = task.task.page;

    spidex.get(url, {
        header: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "accept-langugage": "zh-CN,zh;q=0.8,en-US;q=0.6,en;q=0.4,sv;q=0.2,zh-TW;q=0.2",
            "cache-control": "max-age=0",
            connection: "keep-alive",
            host: "wanimal.lofter.com",
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36"
        },
        charset: "utf8"
    }, function(html, status) {
        if(status !== 200) {
            console.log("× 抓取第 " + page + " 页的时候出错：服务器返回错误的状态码...");

            // 重新 push
            task.task.queue.push(task.task, get);

            // 完成这个任务
            task.task.queue.taskDone(task);
            return;
        }

        var list = parseIndex(html, task);

        console.log("√ 从第 " + page + " 页抓取了 [" + list.length + "] 篇文章目录，加入抓取队列中.");

        for(var i = 0; i < list.length; i++) {
            list[i].referer = url;
            task.task.queue.push(list[i], postPage.get);
        }

        task.task.queue.taskDone(task, true);
    }).on("error", function(err) {
        console.log("× 抓取第 " + page + " 页的时候出错：" + err.message);

        // 重新push
        task.task.queue.push(task.task, get);
        task.task.queue.taskDone(task, true);
    });
}

function parseIndex(html, task) {
    var $ = cheerio.load(html);
    
    // 文章列表
    var list = [];
    $(".post .info .hotcount").next().each(function() {
        list.push({ url: $(this).attr("href"), queue: task.task.queue });
    });

    // 页码
    var nxt = $(".pager .nxt").attr("href");
    if(nxt) {
        var qs = queryString.parse(nxt.substr(1));
        task.task.queue.push({
            url: indexBaseUrl + nxt,
            page: parseInt(qs.page),
            queue: task.task.queue
        }, get);
    }

    return list;
}

exports.get = get;
