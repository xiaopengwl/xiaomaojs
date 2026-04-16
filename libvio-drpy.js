var rule = {
    title: 'LIBVIO',
    host: 'https://www.libvio.lat',
    url: '/type/fyclass-fypage.html',
    detailUrl: '/detail/fvid.html',
    playUrl: '/play/fvid-sid-nid.html',
    searchUrl: '/search/-------------.html;post',
    searchable: 2,
    quickSearch: 0,
    filterable: 0,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.libvio.lat/',
    },
    timeout: 15000,
    class_name: '电影&电视剧&纪录片&动漫&综艺&专题',
    class_url: '1&2&3&4&5&6',
    play_parse: false,
    sniffer: 0,
    lazy: $js.toString(() => {
        let html = request(input);
        let m = html.match(/player_aaaa\s*=\s*(\{.*?\})\s*[,;<]/s);
        if (!m) {
            input = '';
            return;
        }
        let obj;
        try {
            obj = JSON.parse(m[1].replace(/\\\//g, '/'));
        } catch (e) {
            obj = null;
        }
        if (!obj || !obj.url) {
            input = '';
            return;
        }
        let url = obj.url;
        if (obj.encrypt === '1') {
            url = unescape(url);
        } else if (obj.encrypt === '2') {
            try {
                url = decodeURIComponent(atob(url));
            } catch (e) {}
        }
        if (obj.from && obj.from !== 'link') {
            url = {
                jx: 0,
                parse: 0,
                url: url,
                header: rule.headers
            };
        }
        input = url;
    }),
    预处理: $js.toString(() => {
        let html = fetch(rule.host, {headers: rule.headers});
        // 提取首页分类导航
        let navMatch = html.match(/class="stui-header[^"]*"[\s\S]*?<ul class="stui_header__user">/);
        if (navMatch) {
            let navHtml = navMatch[0];
            let links = [];
            let re = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
            let m;
            while ((m = re.exec(navHtml)) !== null) {
                let href = m[1];
                let text = m[2].trim();
                if (href && text && !['首页', '搜索', '留言', '关于'].includes(text)) {
                    links.push({text: text, url: href});
                }
            }
        }
    }),
    "推荐": '.stui-vodlist__box;a&&title;a&&data-original;.pic-text&&Text;a&&href',
    "一级": '.stui-vodlist__box;a&&title;a&&data-original;.pic-text&&Text;a&&href',
    "二级": {
        title: '.stui-content__detail h1.title&&Text',
        img: '.stui-content__thumb a.pic img&&data-original',
        desc: '.stui-content__detail p.data--span',
        content: '.detail-sketch,.detail-content--span',
        tabs: '.stui-play__list:eq(0)&&li',
        lists: '.stui-content__playlist:eq(#id)&&li',
        tab_text: 'a&&Text',
        list_text: 'a&&Text',
        list_url: 'a&&href'
    },
    "搜索": '.stui-vodlist__box;a&&title;a&&data-original;.pic-text&&Text;a&&href',
};
