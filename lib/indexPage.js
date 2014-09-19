/**
 * Created by XadillaX on 2014/6/18.
 */
var spidex = require("spidex");
var postPage = require("./postPage");
var indexBaseUrl = "http://wanimal.lofter.com/?page={page}";

function get(task) {
    var url = task.task.url;
    var page = task.task.page;

    spidex.get(url, function(html, status) {
        if(status !== 200) {
            console.log("× 抓取第 " + page + " 页的时候出错：服务器返回错误的状态码...");

            // 重新push
            task.task.queue.push(task.task, get);

            // 完成这个任务
            task.task.queue.taskDone(task);
            return;
        }

        var list = parseIndex(html, task);
        //console.log(list);

        console.log("√ 从第 " + page + " 页抓取了 [" + list.length + "] 篇文章目录，加入抓取队列中.");

        for(var i = 0; i < list.length; i++) {
            //console.log(list[i]);
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
    var regExp1 = /span> <a href="(.*?)">查看全文<\/a>/g;
    var regExp2 = /span> <a href="(.*?)">查看全文<\/a>/;
    var result = html.match(regExp1);

    if(!result) {
        return [];
    }

    var list = [];
    for(var i = 0; i < result.length; i++) {
        var temp = regExp2.exec(result[i]);
        if(temp.length !== 2) continue;

        list.push({ url: temp[1], queue: task.task.queue });
    }

    // 页码
    var pageRegExp = /<a href="\?page=(\d+)" class="nxt">下一页<\/a>/;
    var page = pageRegExp.exec(html);
    if(page && page.length === 2) {
        task.task.queue.push({
            url     : indexBaseUrl.assign({ page: page[1] }),
            page    : parseInt(page[1]),
            queue   : task.task.queue
        }, get);
    }

    return list;
}

exports.get = get;
