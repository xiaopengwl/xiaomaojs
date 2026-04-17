---
name: zyfun-drpy-source-writing
description: |
  为 zy.fun 写源工具创建 drpy 格式影视源规则（从站点分析到调试、懒加载、交付）。
  触发词：写源、写数据源、写规则、帮我写个源、写一个数据源、写源工具、zy.fun、数据源不对、分类不对、播放错误、教我写源、学写源
version: 1.1.0
author: Hermes Agent + xiaopengwl
license: MIT
metadata:
  hermes:
    tags: [zyfun, drpy, 写源, 影视, 爬虫, web]
    related_skills: []
---

# zy.fun drpy 写源技能

## 适用场景（When to use）
当用户提出以下需求时使用本技能：
- “帮我写个 zy.fun 源”
- “这个站分类/搜索/详情不对”
- “只有一集/播放地址不对/懒加载失败”
- “教我学会 drpy 写源”

---

## 目标输出（Deliverables）
最终应交付：
1. 可运行的 `var rule = {...}` 完整 drpy 规则；
2. 在 zy.fun 写源工具完成 10 步调试验证；
3. 若用户需要，给出可提交 GitHub 的 `*-drpy.js` 文件内容。

---

## 核心流程（必须按顺序）
1. 分析网站结构（分类页、详情页、搜索页、播放页）
2. 编写基础 rule（host/url/searchUrl/class）
3. 配置 推荐/一级/二级/搜索 选择器
4. 调试 tabs/lists 关联（`:eq(#id)&&>li`）
5. 调试播放与 lazy 解密
6. 执行自检清单
7. 输出最终规则与交付说明

---

## 一、前置知识（精简）

### 1) DOM 基础
```html
<div class="items">
  <a class="item" id="1">first item</a>
  <span class="item" id="2">second item</span>
  <li class="item" id="3" data-id="123">third item</li>
</div>
```
- `div/a/span/li`：常见标签
- `class/id/data-*`：属性
- 父子层级决定选择器路径

### 2) JS 基础（调试够用）
```javascript
var name = "zy";
let age = 25;
const PI = 3.14;

str.length;
str.indexOf("World");
str.slice(6, 11);
str.replace("World", "zy");

cars.push("Audi");
cars.pop();

function add(a, b) { return a + b; }

let m = html.match(/thisUrl\s*=\s*["']([^"']+)["']/);
if (m) url = m[1];
```

### 3) pd 语法（重点）
```javascript
pdfh(html, '.item-2 a&&href')          // 属性
pdfh(html, '.item-2&&Text')            // 文本（含子元素文本）
pdfh(html, '.item-2--i--font&&Text')   // 移除 i/font 后取文本
```
`&&` 后常见取值：
- `Text`
- `href/src/alt/title/data-*`
- `--tagname`（先移除标签再取文本）

### 4) 中文键必须加引号
```javascript
// ✅
"推荐": "...",
"一级": "...",
"二级": {...},
"搜索": "...",

// ❌
推荐: "...",
```

---

## 二、标准规则模板（可直接改）

```javascript
var rule = {
  title: '网站名称',
  host: 'https://目标网站.com',

  url: '/分类URL模板',                  // 支持 fypage / fyclass
  searchUrl: '/搜索URL?wd=**',          // ** 为关键词

  searchable: 2,
  quickSearch: 0,
  filterable: 0,

  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://目标网站.com/',
  },
  timeout: 15000,

  class_name: '电影&电视剧&动漫',
  class_url: '1&2&3',

  play_parse: true,
  sniffer: 0,
  lazy: '',
  play_headers: {},

  "推荐": '容器;标题选择器;图片选择器;描述选择器;链接选择器',
  "一级": '容器;标题选择器;图片选择器;描述选择器;链接选择器',
  "搜索": '容器;标题选择器;图片选择器;描述选择器;链接选择器',

  "二级": {
    title: '.title&&Text',
    img: '.thumb img&&data-original',
    desc: '.desc&&Text',
    content: '.detail&&Text',

    tabs: '.nav-tabs li',
    lists: '.playlist:eq(#id)&&>li',
    tab_text: 'a&&Text',
    list_text: 'a&&Text',
    list_url: 'a&&href',
  },
};
```

---

## 三、选择器规则与高频坑

### 1) `推荐/一级/搜索` 五段式（分号分隔）
```javascript
"一级": '.stui-vodlist__box;a&&title;a&&data-original;.pic-text&&Text;a&&href'
```
顺序固定：`容器;标题;图片;描述;链接`

### 2) tabs 与 lists 绑定（最关键）
```javascript
"二级": {
  tabs: '.nav-tabs li',
  lists: '.stui-content__playlist:eq(#id)&&>li',
  tab_text: 'a&&Text',
  list_text: 'a&&Text',
  list_url: 'a&&href',
}
```
必须点：
- 用 `:eq(#id)` 自动映射线路索引
- `&&>li` 必须写（不能空格）
- 常见错误：漏 `&&`，导致只显示一集

### 3) 避免动态 class
```javascript
// ❌ 动态 class（静态源码里可能不存在）
'.nav-tabs li.active'

// ✅ 用稳定结构
'.nav-tabs li'
'.tab-pane'
'#playlist2'
```

---

## 四、10 步调试流程（zy.fun 写源工具）

按顺序执行：
1. **源码**：输入 URL，抓 HTML  
2. **节点**：测 `pdfh` 单点字段  
3. **列表**：测 `pdfa` 列表规则  
4. **初始化**：加载模板  
5. **分类**：检查 class 是否命中  
6. **首页**：检查推荐列表  
7. **列表**：`t=分类ID` 测一级  
8. **详情**：`ids=详情ID` 测二级  
9. **搜索**：`wd=关键词` 测搜索  
10. **播放**：`flag=线路&play=选集` 测播放

---

## 五、lazy 懒加载常用模板

### 1) 正则提取
```javascript
lazy: 'js: let m = input.match(/thisUrl\\s*=\\s*["\']([^"\']+)["\']/); if (m) input = m[1];'
```

### 2) iframe 提取
```javascript
lazy: 'js: let m = input.match(/src="([^"?]+\\/dplayer\\/index\\.php[^"]+)"/); if (m) input = m[1];'
```

### 3) AES 解密（示例）
```javascript
lazy: $js.toString(() => {
  let kurl = input;
  let khtml = request(kurl);
  if (/dujia/.test(khtml)) {
    kurl = khtml.split("PPPP = '")[1].split("';")[0];
    const key = CryptoJS.enc.Utf8.parse("Isu7fOAvI6!&IKpAbVdhf&^F");
    const dataObj = { ciphertext: CryptoJS.enc.Base64.parse(kurl) };
    const decrypted = CryptoJS.AES.decrypt(dataObj, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    kurl = decrypted.toString(CryptoJS.enc.Utf8);
  } else {
    kurl = khtml.split('src: "')[1].split('",')[0];
  }
  input = { jx: 0, parse: 0, url: kurl, header: rule.headers };
}),
```

### 4) 自定义解码
```javascript
lazy: 'js:let s=input.replace(/\\\\/g,"");let r="";for(let i=0;i<s.length;i++){let c=s.charCodeAt(i);r+=String.fromCharCode(c>127?(c^83):c);}try{r=atob(r);}catch(e){}input={parse:0,url:r};'
```

---

## 六、故障排查清单（每次交付前必查）

- [ ] 中文键 `"推荐" "一级" "二级" "搜索"` 都加引号
- [ ] 列表字段是 5 段分号结构
- [ ] 二级 `lists` 使用 `:eq(#id)&&>li`
- [ ] 未使用动态 class（如 `.active`）
- [ ] lazy 正则能命中真实页面内容
- [ ] `headers.Referer` 指向正确域
- [ ] `play_parse/sniffer` 组合符合站点需求
- [ ] 搜索、详情、播放三者均实测通过

---

## 七、实战案例（可参考）

### 案例 A：4kvm.me（节选）
```javascript
var rule = {
  title: '4k影视',
  host: 'https://www.4kvm.me',
  url: '/filter?classify=fyclass&page=fypage',
  searchUrl: '/search?q=**',
  searchable: 2,
  class_name: '电影&电视剧&动漫',
  class_url: '1&2&3',
  "一级": 'div.movie-card;h3&&Text;img&&data-src;img&&alt;a.block&&href',
  "二级": {
    title: '.movie-poster h1&&Text',
    img: '.movie-poster img&&src',
    lists: 'a.episode-link',
    list_text: 'span&&Text',
    list_url: 'a&&href'
  }
};
```

### 案例 B：百思派电影网（节选）
```javascript
var rule = {
  title: '百思派电影网',
  host: 'https://www.bestpipe.cn',
  url: '/vodtype/fyclass-fypage.html',
  searchUrl: '/vodsearch/-------------.html;post',
  class_name: '电影&剧集&短剧&动漫&综艺',
  class_url: '20&21&24&22&23',
  "一级": '.stui-vodlist__box;a&&title;a&&data-original;.pic-text&&Text;a&&href',
  "二级": {
    tabs: '.nav-tabs li',
    lists: '.stui-content__playlist:eq(#id)&&>li',
    tab_text: 'a&&Text',
    list_text: 'a&&Text',
    list_url: 'a&&href'
  },
  "搜索": '.stui-vodlist__box;a&&title;a&&data-original;.pic-text&&Text;a&&href'
};
```

---

## 八、GitHub 交付规范

### 命名
- `站点名-drpy.js`（例如：`4kyingshi-drpy.js`）

### 目录
- 放仓库根目录（按用户仓库约定可调整）

### 提交示例
```bash
git clone https://github.com/xiaopengwl/xiaomaojs.git
cd xiaomaojs
# 新建并粘贴规则到：新站点-drpy.js
git add 新站点-drpy.js
git commit -m "Add 新站点 drpy source"
git push origin main
```

---

## 参考资料
- 写源语法：https://zy.catni.cn/zh-CN/source/grammar.html
- 写源工具：https://zy.catni.cn/zh-CN/source/ide.html
- 静态筛选：https://zy.catni.cn/zh-CN/source/sift.html
- 数据爬虫：https://zy.catni.cn/zh-CN/source/spider.html
- 常见技巧：https://zy.catni.cn/zh-CN/source/skill.html
