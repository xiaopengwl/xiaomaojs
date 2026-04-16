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
    timeout: 30000,
    class_name: '电影&电视剧&纪录片&动漫&综艺&专题',
    class_url: '1&2&3&4&5&6',
    play_parse: false,
    sniffer: 0,
    lazy: $js.toString(function() {
        var html = request(input);
        var m = html.match(/player_aaaa\s*=\s*(\{.*?\})\s*[,;<]/s);
        if (!m) {
            input = '';
            return;
        }
        var obj;
        try {
            obj = JSON.parse(m[1].replace(/\\\//g, '/'));
        } catch (e) {
            obj = null;
        }
        if (!obj || !obj.url) {
            input = '';
            return;
        }
        var url = obj.url;
        if (obj.encrypt === '1') {
            url = unescape(url);
        } else if (obj.encrypt === '2') {
            try {
                url = decodeURIComponent(atob(url));
            } catch (e) {}
        } else if (obj.encrypt === '3') {
            // obj.url is already XOR-0x53 + hex encoded. artplayer decodes it internally.
            // Just construct the iframe URL — no extra encoding needed.
            url = 'https://www.libvio.lat/static/player/artplayer/?url=' + obj.url + '&next=' + input;
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
    "推荐": '.stui-vodlist__box;a&&title;a&&data-original;.pic-text&&Text;a&&href',
    "一级": '.stui-vodlist__box;a&&title;a&&data-original;.pic-text&&Text;a&&href',
    "二级": {
        title: '.stui-content__detail h1.title&&Text',
        img: '.stui-content__thumb a.pic img&&data-original',
        desc: '.stui-content__detail p.data--span',
        content: '.detail-sketch,.detail-content--span',
        tabs: 'h3.icon-iconfontplay2',
        lists: 'ul.stui-content__playlist:eq(#id)&&li',
        tab_text: '',
        list_text: 'a&&Text',
        list_url: 'a&&href'
    },
    "搜索": '.stui-vodlist__box;a&&title;a&&data-original;.pic-text&&Text;a&&href',
};
