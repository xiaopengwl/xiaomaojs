// 51视频网 JS解析源
// 适用于小猫影视

/**
 * 分类函数 - 获取所有分类
 * @returns {string} JSON字符串，格式：[{"type_id":"分类ID","type_name":"分类名称"}]
 */
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

/**
 * 首页/列表函数 - 获取视频列表
 * @param {number} page 页码，从1开始
 * @returns {string} JSON字符串，格式：{"page":当前页,"pagecount":总页数,"list":[{"vod_id":"ID","vod_name":"标题","vod_pic":"图片URL","vod_remarks":"备注"}]}
 */
function get51Home(page) {
    // 拼接URL
    let url = 'https://d3an8gb8ri1qwv.cloudfront.net/';
    if (page > 1) {
        url = `https://d3an8gb8ri1qwv.cloudfront.net/page/${page}/`;
    }
    
    // 请求首页
    const html = fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const list = [];
    
    // 解析文章列表
    // 使用正则匹配每个文章块
    const articleRegex = /<article[\s\S]*?<a href="([^"]+)"[\s\S]*?<h2 class="post-card-title"[^>]*>([\s\S]*?)<\/h2>[\s\S]*?background-image[:\s]*url\(['"]?([^'")]+)['"]?\)/g;
    let match;
    while ((match = articleRegex.exec(html)) !== null) {
        const link = match[1];
        const title = match[2].replace(/<[^>]+>/g, '').trim(); // 去除HTML标签
        const pic = match[3];
        
        // 获取分类信息（如果有）
        const categoryMatch = html.substr(match.index).match(/<span>([^<]+)<\/span>/);
        const remark = categoryMatch ? categoryMatch[1] : '';
        
        list.push({
            vod_id: link,
            vod_name: title,
            vod_pic: pic,
            vod_remarks: remark
        });
    }
    
    // 获取总页数
    const pageCountMatch = html.match(/<a href="\/page\/(\d+)\/">(\d+)<\/a>[^<]*<\/li>\s*<li class="btn btn-primary next"/);
    const pageCount = pageCountMatch ? parseInt(pageCountMatch[2]) : 1;
    
    return JSON.stringify({
        page: page,
        pagecount: pageCount,
        list: list
    });
}

/**
 * 搜索函数 - 搜索视频
 * @param {string} keyword 搜索关键词
 * @param {number} page 页码
 * @returns {string} JSON字符串，格式同首页
 */
function get51Search(keyword, page) {
    const url = `https://d3an8gb8ri1qwv.cloudfront.net/page/${page}/?s=${encodeURIComponent(keyword)}`;
    
    const html = fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    const list = [];
    
    // 解析搜索结果
    const articleRegex = /<article[\s\S]*?<a href="([^"]+)"[\s\S]*?<h2 class="post-card-title"[^>]*>([\s\S]*?)<\/h2>[\s\S]*?background-image[:\s]*url\(['"]?([^'")]+)['"]?\)/g;
    let match;
    while ((match = articleRegex.exec(html)) !== null) {
        const link = match[1];
        const title = match[2].replace(/<[^>]+>/g, '').trim();
        const pic = match[3];
        
        list.push({
            vod_id: link,
            vod_name: title,
            vod_pic: pic,
            vod_remarks: '搜索结果'
        });
    }
    
    // 获取总页数
    const pageCountMatch = html.match(/<a href="\/page\/(\d+)\/">(\d+)<\/a>[^<]*<\/li>\s*<li class="btn btn-primary next"/);
    const pageCount = pageCountMatch ? parseInt(pageCountMatch[2]) : 1;
    
    return JSON.stringify({
        page: page,
        pagecount: pageCount,
        list: list
    });
}

/**
 * 详情函数 - 获取视频详情和播放地址
 * @param {string} url 详情页URL，如 /archives/188279/
 * @returns {string} JSON字符串，格式：{"vod_id":"ID","vod_name":"标题","vod_pic":"图片","vod_play_from":"来源","vod_play_url":"播放地址$集数"}
 */
function get51Detail(url) {
    const fullUrl = `https://d3an8gb8ri1qwv.cloudfront.net${url}`;
    
    const html = fetch(fullUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    // 提取标题
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // 提取图片
    const picMatch = html.match(/background-image[:\s]*url\(['"]?([^'")]+)['"]?\)/);
    const pic = picMatch ? picMatch[1] : '';
    
    // 提取视频地址 - 这需要根据实际页面结构调整
    // 方案1：直接查找视频文件链接
    let videoUrl = '';
    
    // 尝试匹配 video 标签
    const videoTagMatch = html.match(/<video[^>]*>[\s\S]*?<source[^>]*src="([^"]+)"[^>]*>/i);
    if (videoTagMatch) {
        videoUrl = videoTagMatch[1];
    }
    
    // 如果没有video标签，尝试匹配iframe
    if (!videoUrl) {
        const iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"[^>]*>/i);
        if (iframeMatch) {
            videoUrl = iframeMatch[1];
        }
    }
    
    // 如果还是没找到，尝试匹配常见的视频链接格式
    if (!videoUrl) {
        const linkMatch = html.match(/https?:\/\/[^\s"']+\.(mp4|m3u8|flv)[^\s"']*/i);
        if (linkMatch) {
            videoUrl = linkMatch[0];
        }
    }
    
    // 构建播放链接字符串（格式：视频地址$集数）
    // 这里因为没有分集，所以集数写"第1集"
    const playUrl = videoUrl ? `${videoUrl}$第1集` : '';
    
    return JSON.stringify({
        vod_id: url,
        vod_name: title,
        vod_pic: pic,
        vod_play_from: '51视频',
        vod_play_url: playUrl
    });
}

// 导出函数（小猫影视要求）
module.exports = {
    get51Category,
    get51Home,
    get51Search,
    get51Detail
};
