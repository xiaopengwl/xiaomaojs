// 51视频 JS解析器
// 分类函数
function get51Category() {
    const categories = [
        { type_id: "wpcz", type_name: "今日推荐" },
        { type_id: "lpjp", type_name: "撸片精品" },
        { type_id: "meiridasai", type_name: "每日大赛" },
        { type_id: "rdsj", type_name: "吃瓜爆料" },
        { type_id: "lljx", type_name: "伦理精选" },
        { type_id: "xsxy", type_name: "学生校园" },
        { type_id: "tynd", type_name: "体育男大" },
        { type_id: "smtt", type_name: "色漫天堂" },
        { type_id: "whhl", type_name: "网红黑料" },
        { type_id: "ysyl", type_name: "看片娱乐" },
        { type_id: "cqdb", type_name: "超前点播" },
        { type_id: "qubk", type_name: "奇趣百科" },
        { type_id: "51yc", type_name: "51原创" },
        { type_id: "dyds", type_name: "短剧影视" }
    ];
    return JSON.stringify(categories);
}

// 首页/列表函数 - 支持分类筛选
function get51Home(page, category) {
    page = page || 1;
    let url = 'https://d3an8gb8ri1qwv.cloudfront.net/';
    
    if (category) {
        // 分类页：https://d3an8gb8ri1qwv.cloudfront.net/category/xxx/page/2/
        url = `https://d3an8gb8ri1qwv.cloudfront.net/category/${category}/`;
        if (page > 1) url = `https://d3an8gb8ri1qwv.cloudfront.net/category/${category}/page/${page}/`;
    } else {
        // 首页：https://d3an8gb8ri1qwv.cloudfront.net/page/2/
        if (page > 1) url = `https://d3an8gb8ri1qwv.cloudfront.net/page/${page}/`;
    }
    
    const html = fetch(url);
    return parseVideoList(html);
}

// 搜索函数
function get51Search(keyword, page) {
    page = page || 1;
    const searchUrl = `https://d3an8gb8ri1qwv.cloudfront.net/search/${encodeURIComponent(keyword)}/`;
    const html = fetch(searchUrl);
    return parseVideoList(html);
}

// 详情函数 - 提取m3u8视频地址
function get51Detail(id) {
    // id是文章URL，如 /archives/188279/
    const detailUrl = `https://d3an8gb8ri1qwv.cloudfront.net${id}`;
    const html = fetch(detailUrl);
    
    // 解析文章标题
    const titleMatch = html.match(/<h1[^>]*class="post-title[^>]*>([^<]+)</);
    const title = titleMatch ? titleMatch[1].trim() : "视频详情";
    
    // 解析视频地址 - 从dplayer的data-config中提取
    const videoUrls = [];
    
    // 方法1：提取所有dplayer的data-config
    const playerMatches = [...html.matchAll(/<div[^>]*class="dplayer"[^>]*data-config='([^']+)'/g)];
    
    for (const match of playerMatches) {
        try {
            const config = JSON.parse(match[1].replace(/\\/g, ''));
            if (config.video && config.video.url) {
                videoUrls.push({
                    name: "高清线路",
                    url: config.video.url
                });
            }
        } catch (e) {
            // 忽略解析错误
        }
    }
    
    // 方法2：如果上面没找到，尝试直接正则匹配video url
    if (videoUrls.length === 0) {
        const urlMatches = html.match(/"url":"([^"]+\.m3u8[^"]*)"/);
        if (urlMatches) {
            videoUrls.push({
                name: "高清线路",
                url: urlMatches[1].replace(/\\\//g, '/')
            });
        }
    }
    
    // 如果没有视频地址，返回错误信息
    if (videoUrls.length === 0) {
        return JSON.stringify({
            list: [],
            msg: "未找到视频地址"
        });
    }
    
    // 构造返回数据
    const vod = {
        vod_id: id,
        vod_name: title,
        vod_pic: extractFirstImage(html) || "",
        vod_remarks: extractRemarks(html) || "点击播放",
        vod_content: extractContent(html) || title,
        vod_play_from: "51视频",
        vod_play_url: videoUrls.map(v => `${v.name}$${v.url}`).join('#')
    };
    
    return JSON.stringify({
        list: [vod]
    });
}

// ========== 辅助函数 ==========
function parseVideoList(html) {
    const items = [];
    
    // 匹配文章项的正则
    const articleRegex = /<article[^>]*itemscope[^>]*>([\s\S]*?)<\/article>/g;
    const articles = [...html.matchAll(articleRegex)];
    
    for (const article of articles) {
        const articleHtml = article[1];
        
        // 提取链接
        const linkMatch = articleHtml.match(/<a[^>]*href="([^"]+)"[^>]*>/);
        if (!linkMatch) continue;
        
        const link = linkMatch[1];
        
        // 提取标题
        const titleMatch = articleHtml.match(/<h2[^>]*class="post-card-title[^>]*>([\s\S]*?)<\/h2>/);
        if (!titleMatch) continue;
        
        // 清理标题中的HTML标签
        let title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
        
        // 提取图片
        let pic = "";
        const picMatch = articleHtml.match(/loadBannerDirect\('([^']+)'/);
        if (picMatch) {
            pic = picMatch[1];
        } else {
            const imgMatch = articleHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/);
            if (imgMatch) pic = imgMatch[1];
        }
        
        // 提取备注（时间/分类）
        let remarks = "";
        const infoMatch = articleHtml.match(/<span[^>]*itemprop="datePublished"[^>]*>([^<]+)</);
        if (infoMatch) remarks = infoMatch[1];
        
        items.push({
            vod_id: link,
            vod_name: title,
            vod_pic: pic,
            vod_remarks: remarks
        });
    }
    
    return JSON.stringify({
        page: 1,
        pagecount: 1,
        limit: items.length,
        total: items.length,
        list: items
    });
}

function extractFirstImage(html) {
    const match = html.match(/loadBannerDirect\('([^']+)'/);
    if (match) return match[1];
    
    const imgMatch = html.match(/<img[^>]*src="([^"]+\.(jpe?g|png|gif))"[^>]*>/i);
    return imgMatch ? imgMatch[1] : "";
}

function extractRemarks(html) {
    const timeMatch = html.match(/<time[^>]*>([^<]+)</);
    return timeMatch ? timeMatch[1] : "";
}

function extractContent(html) {
    const contentMatch = html.match(/<div[^>]*class="post-content"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="(?:tags|copyright)/);
    if (contentMatch) {
        return contentMatch[1].replace(/<[^>]+>/g, '').substring(0, 200);
    }
    return "";
}

// 简单的fetch模拟（实际运行时由小猫影视提供）
function fetch(url) {
    // 这里只是占位，实际JS源运行时会有内置的fetch方法
    return "";
}