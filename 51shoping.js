// 51视频 - 吃瓜爆料 JS源
// 适用于小猫影视 >=2.6.0 版本

interface IMovie {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks?: string;
  vod_play_from?: string;
  vod_play_url?: string;
  vod_content?: string;
}

interface ICategory {
  id: string;
  text: string;
}

interface IHomeResult {
  page: number;
  pagecount: number;
  list: IMovie[];
}

export default class VideoSource51 implements Handle {
  
  // 基础配置
  getConfig() {
    return {
      id: '51shipin_v1_' + Math.random().toString(36).substring(2, 10),
      name: '51视频 - 吃瓜爆料',
      api: 'https://d3an8gb8ri1qwv.cloudfront.net',
      logo: 'https://51sptv.com/usr/themes/Mirages/images/51cg.png',
      desc: '全网最新吃瓜爆料与福利视频，每日更新网红黑料、社会猛料',
      nsfw: true,
      type: 1
    };
  }

  // ==================== 分类函数 ====================
  async getCategory(): Promise<ICategory[]> {
    // 从网站导航栏提取的所有分类
    return [
      { id: 'wpcz', text: '今日推荐' },
      { id: 'lpjp', text: '撸片精品' },
      { id: 'meiridasai', text: '每日大赛' },
      { id: 'rdsj', text: '吃瓜爆料' },
      { id: 'lljx', text: '伦理精选' },
      { id: 'xsxy', text: '学生校园' },
      { id: 'tynd', text: '体育男大' },
      { id: 'smtt', text: '色漫天堂' },
      { id: 'whhl', text: '网红黑料' },
      { id: 'ysyl', text: '看片娱乐' },
      { id: 'cqdb', text: '超前点播' },
      { id: 'qubk', text: '奇趣百科' },
      { id: '51yc', text: '51原创' },
      { id: 'dyds', text: '短剧影视' }
    ];
  }

  // ==================== 首页/列表函数 ====================
  async getHome(page: number = 1): Promise<IHomeResult> {
    try {
      // 构建URL
      const baseUrl = this.getConfig().api;
      const url = page === 1 ? baseUrl : `${baseUrl}/page/${page}/`;
      
      // 请求页面
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // 提取文章列表
      const list: IMovie[] = [];
      
      // 正则匹配所有文章（适配首页HTML结构）
      const articleRegex = /<article[^>]*>(.*?)<\/article>/gs;
      let articleMatch;
      
      while ((articleMatch = articleRegex.exec(html)) !== null) {
        const articleHtml = articleMatch[1];
        
        // 提取详情页链接
        const linkMatch = articleHtml.match(/<a\s+href="([^"]+)"[^>]*>/i);
        if (!linkMatch) continue;
        
        const vod_id = linkMatch[1].trim();
        
        // 提取标题
        let title = '';
        const titleMatch = articleHtml.match(/<h2[^>]*class="post-card-title"[^>]*>(.*?)<\/h2>/is);
        if (titleMatch) {
          title = titleMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }
        
        // 提取图片
        let vod_pic = '';
        // 先从background-image提取
        const bgMatch = articleHtml.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
        if (bgMatch) {
          vod_pic = bgMatch[1];
        } else {
          // 从img标签提取
          const imgMatch = articleHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
          if (imgMatch) {
            vod_pic = imgMatch[1];
          }
        }
        
        // 提取分类/备注信息
        let remarks = '';
        const categoryMatch = articleHtml.match(/<span[^>]*itemprop="datePublished"[^>]*>.*?<\/span>\s*<span>([^<]+)<\/span>/i);
        if (categoryMatch) {
          remarks = categoryMatch[1].trim();
        }
        
        // 跳过广告文章（没有标题的）
        if (title && !articleHtml.includes('post-card-ads')) {
          list.push({
            vod_id,
            vod_name: title,
            vod_pic: vod_pic || 'https://51sptv.com/usr/themes/Mirages/images/51cg.png',
            vod_remarks: remarks || '热门爆料',
            vod_play_from: '51视频'
          });
        }
      }
      
      // 提取总页数
      let pagecount = 1;
      const pageRegex = /<a\s+href="\/page\/(\d+)\/"[^>]*>(\d+)<\/a>/g;
      let pageMatch;
      const pages: number[] = [];
      
      while ((pageMatch = pageRegex.exec(html)) !== null) {
        pages.push(parseInt(pageMatch[2]));
      }
      
      if (pages.length > 0) {
        pagecount = Math.max(...pages);
      } else {
        // 如果没有找到分页，默认取1231（从首页看到的）
        pagecount = 1231;
      }
      
      return {
        page: page,
        pagecount: pagecount,
        list: list
      };
      
    } catch (error) {
      console.error('getHome error:', error);
      return {
        page: page,
        pagecount: 1,
        list: []
      };
    }
  }

  // ==================== 分类列表函数 ====================
  async getCategoryVod(categoryId: string, page: number = 1): Promise<IHomeResult> {
    try {
      const baseUrl = this.getConfig().api;
      const url = page === 1 
        ? `${baseUrl}/category/${categoryId}/`
        : `${baseUrl}/category/${categoryId}/page/${page}/`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // 复用首页的解析逻辑
      const list: IMovie[] = [];
      
      const articleRegex = /<article[^>]*>(.*?)<\/article>/gs;
      let articleMatch;
      
      while ((articleMatch = articleRegex.exec(html)) !== null) {
        const articleHtml = articleMatch[1];
        
        const linkMatch = articleHtml.match(/<a\s+href="([^"]+)"[^>]*>/i);
        if (!linkMatch) continue;
        
        const vod_id = linkMatch[1].trim();
        
        let title = '';
        const titleMatch = articleHtml.match(/<h2[^>]*class="post-card-title"[^>]*>(.*?)<\/h2>/is);
        if (titleMatch) {
          title = titleMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }
        
        let vod_pic = '';
        const bgMatch = articleHtml.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
        if (bgMatch) {
          vod_pic = bgMatch[1];
        } else {
          const imgMatch = articleHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
          if (imgMatch) {
            vod_pic = imgMatch[1];
          }
        }
        
        if (title && !articleHtml.includes('post-card-ads')) {
          list.push({
            vod_id,
            vod_name: title,
            vod_pic: vod_pic || 'https://51sptv.com/usr/themes/Mirages/images/51cg.png',
            vod_remarks: categoryId,
            vod_play_from: '51视频'
          });
        }
      }
      
      // 提取分页信息
      let pagecount = 1;
      const pageRegex = /<a\s+href="\/category\/[^/]+\/page\/(\d+)\/"[^>]*>(\d+)<\/a>/g;
      let pageMatch;
      const pages: number[] = [];
      
      while ((pageMatch = pageRegex.exec(html)) !== null) {
        pages.push(parseInt(pageMatch[2]));
      }
      
      if (pages.length > 0) {
        pagecount = Math.max(...pages);
      }
      
      return {
        page: page,
        pagecount: pagecount,
        list: list
      };
      
    } catch (error) {
      console.error('getCategoryVod error:', error);
      return {
        page: page,
        pagecount: 1,
        list: []
      };
    }
  }

  // ==================== 搜索函数 ====================
  async getSearch(keyword: string, page: number = 1): Promise<IHomeResult> {
    try {
      const baseUrl = this.getConfig().api;
      // 搜索URL格式：/?s=关键词 或 /page/页码/?s=关键词
      const encodedKeyword = encodeURIComponent(keyword);
      const url = page === 1
        ? `${baseUrl}/?s=${encodedKeyword}`
        : `${baseUrl}/page/${page}/?s=${encodedKeyword}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // 解析搜索结果（与首页相同结构）
      const list: IMovie[] = [];
      
      const articleRegex = /<article[^>]*>(.*?)<\/article>/gs;
      let articleMatch;
      
      while ((articleMatch = articleRegex.exec(html)) !== null) {
        const articleHtml = articleMatch[1];
        
        const linkMatch = articleHtml.match(/<a\s+href="([^"]+)"[^>]*>/i);
        if (!linkMatch) continue;
        
        const vod_id = linkMatch[1].trim();
        
        let title = '';
        const titleMatch = articleHtml.match(/<h2[^>]*class="post-card-title"[^>]*>(.*?)<\/h2>/is);
        if (titleMatch) {
          title = titleMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }
        
        let vod_pic = '';
        const bgMatch = articleHtml.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
        if (bgMatch) {
          vod_pic = bgMatch[1];
        } else {
          const imgMatch = articleHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
          if (imgMatch) {
            vod_pic = imgMatch[1];
          }
        }
        
        if (title && !articleHtml.includes('post-card-ads')) {
          list.push({
            vod_id,
            vod_name: title,
            vod_pic: vod_pic || 'https://51sptv.com/usr/themes/Mirages/images/51cg.png',
            vod_remarks: '搜索结果',
            vod_play_from: '51视频'
          });
        }
      }
      
      return {
        page: page,
        pagecount: 1, // 搜索结果通常只有一页
        list: list
      };
      
    } catch (error) {
      console.error('getSearch error:', error);
      return {
        page: page,
        pagecount: 1,
        list: []
      };
    }
  }

  // ==================== 详情函数 ====================
  async getDetail(id: string): Promise<IMovie> {
    try {
      const baseUrl = this.getConfig().api;
      // id可能是完整URL或相对路径
      const url = id.startsWith('http') ? id : `${baseUrl}${id}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // 提取标题
      let title = '';
      const titleMatch = html.match(/<h1[^>]*class="post-title"[^>]*>(.*?)<\/h1>/is) ||
                         html.match(/<h2[^>]*class="post-card-title"[^>]*>(.*?)<\/h2>/is);
      if (titleMatch) {
        title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
      }
      
      // 提取描述/内容
      let content = '';
      const contentMatch = html.match(/<div[^>]*class="post-content"[^>]*>(.*?)<\/div>/is);
      if (contentMatch) {
        content = contentMatch[1].replace(/<[^>]*>/g, '').substring(0, 200) + '...';
      }
      
      // 提取图片
      let pic = '';
      const picMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"[^>]*>/i) ||
                       html.match(/<img[^>]*class="post-cover"[^>]*src="([^"]+)"[^>]*>/i);
      if (picMatch) {
        pic = picMatch[1];
      }
      
      // 提取视频播放地址 - 关键部分
      // 方法1：查找直接视频链接
      let videoUrl = '';
      const videoRegex = /(https?:\/\/[^"'\s]+\.(?:mp4|m3u8|flv|mkv|avi)[^"'\s]*)/gi;
      const videoMatch = html.match(videoRegex);
      
      // 方法2：查找iframe嵌入
      let iframeUrl = '';
      const iframeRegex = /<iframe[^>]*src="([^"]+)"[^>]*>/gi;
      const iframeMatch = iframeRegex.exec(html);
      
      if (videoMatch && videoMatch.length > 0) {
        // 找到直接视频链接
        videoUrl = videoMatch[0];
      } else if (iframeMatch) {
        // 找到iframe，将iframe URL作为播放链接（触发嗅探）
        iframeUrl = iframeMatch[1];
        videoUrl = iframeUrl;
      }
      
      // 构建播放列表
      let playUrl = '';
      if (videoUrl) {
        // 如果有视频地址，创建播放列表
        playUrl = `在线播放${videoUrl}`;
      } else {
        // 没有找到视频，返回文章页面本身，让嗅探器工作
        playUrl = `在线播放${url}`;
      }
      
      return {
        vod_id: id,
        vod_name: title || '51视频',
        vod_pic: pic || 'https://51sptv.com/usr/themes/Mirages/images/51cg.png',
        vod_remarks: '点击播放',
        vod_play_from: '51视频',
        vod_play_url: playUrl,
        vod_content: content || '热门吃瓜爆料视频，请点击播放按钮观看'
      };
      
    } catch (error) {
      console.error('getDetail error:', error);
      return {
        vod_id: id,
        vod_name: '51视频',
        vod_pic: 'https://51sptv.com/usr/themes/Mirages/images/51cg.png',
        vod_remarks: '加载失败',
        vod_play_from: '51视频',
        vod_play_url: `在线播放${id}`,
        vod_content: '详情加载失败，请重试'
      };
    }
  }

  // ==================== iframe解析函数（可选） ====================
  async parseIframe(url: string): Promise<string> {
    try {
      // 如果iframe页面直接包含视频，可以在这里解析
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        return url; // 返回原URL，让嗅探器处理
      }
      
      const html = await response.text();
      
      // 查找视频链接
      const videoRegex = /(https?:\/\/[^"'\s]+\.(?:mp4|m3u8|flv)[^"'\s]*)/gi;
      const videoMatch = html.match(videoRegex);
      
      if (videoMatch && videoMatch.length > 0) {
        return videoMatch[0];
      }
      
      return url; // 没找到视频，返回原URL
      
    } catch (error) {
      console.error('parseIframe error:', error);
      return url;
    }
  }
}
