// ignore
import { WebApiBase, VideoClass } from '../core/uzCode.js'
import { parse } from 'node-html-parser'
// ignore

class kkys01Class extends WebApiBase {
    constructor() {
        super()
        this.webSite = 'https://www.kkys01.com'
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
            'Referer': this.webSite + '/',
        }
    }

    async getClassList(args) {
        let backData = new RepVideoClassList()
        try {
            await this.initCookie()
            const pro = await req(this.webSite, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allClass = document.querySelectorAll('.nav-swiper-slide')
                let list = []
                for (let index = 0; index < allClass.length; index++) {
                    const element = allClass[index]
                    let type_name = element.querySelector('a')?.text?.trim() || ''
                    let url = element.querySelector('a')?.attributes['href'] || ''
                    if (this.isIgnoreClassName(type_name)) continue
                    let match = url.match(/\/(\w+)\.html/)
                    if (match) {
                        let videoClass = new VideoClass()
                        videoClass.type_id = match[1]
                        videoClass.type_name = type_name
                        videoClass.hasSubclass = true
                        list.push(videoClass)
                    }
                }
                backData.data = list
            }
        } catch (error) {
            backData.error = '获取分类失败～' + error.message
        }
        return JSON.stringify(backData)
    }

    async getVideoList(args) {
        let backData = new RepVideoList()
        try {
            await this.initCookie()
            let page = args.page || 1
            let typeId = args.url || '1'
            let listUrl = `${this.webSite}/show/${typeId}-----------${page}.html`
            let pro = await req(listUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allVideo = document.querySelectorAll('.module-item')
                let videos = []
                for (let index = 0; index < allVideo.length; index++) {
                    const element = allVideo[index]
                    let vodUrl = element.querySelector('a')?.attributes['href'] || ''
                    let vodPic = element.querySelector('img')?.attributes['data-original'] || ''
                    let vodName = element.querySelector('.v-item-title')?.text?.trim() || ''
                    let vodDiJiJi = element.querySelector('span')?.lastChild?.text?.trim() || ''
                    vodUrl = this.combineUrl(vodUrl)
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = vodUrl
                    videoDet.vod_pic = this.getFullImgUrl(vodPic)
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi
                    videos.push(videoDet)
                }
                backData.data = videos
            }
        } catch (error) {
            backData.error = '获取列表失败～' + error.message
        }
        return JSON.stringify(backData)
    }

    async getVideoDetail(args) {
        let backData = new RepVideoDetail()
        try {
            let webUrl = args.url
            let pro = await req(webUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let vod_name = document.querySelector('.detail-title strong')?.text?.trim() || ''
                let vod_pic = document.querySelector('.detail-pic img')?.attributes['data-original'] || ''
                let vod_content = document.querySelector('.detail-desc')?.text?.trim() || ''
                let descList = document.querySelectorAll('.detail-info-row-main')
                let vod_year = '', vod_area = '', vod_lang = '', type_name = ''
                for (let item of descList) {
                    let text = item.text?.trim() || ''
                    if (text.includes('年份') || /\d{4}/.test(text)) {
                        vod_year = text.match(/\d{4}/)?.[0] || ''
                    } else if (text.includes('地区')) {
                        vod_area = text.replace('地区', '').trim()
                    } else if (text.includes('语言')) {
                        vod_lang = text.replace('语言', '').trim()
                    }
                }
                let playList = document.querySelectorAll('.source-item')
                let juJiList = document.querySelectorAll('.episode-list')
                let vod_play_from = ''
                let vod_play_url = ''
                for (let i = 0; i < playList.length; i++) {
                    let from = playList[i].querySelector('span')?.lastChild?.text?.trim() || `线路${i+1}`
                    let episodes = juJiList[i]?.querySelectorAll('a') || []
                    for (let ep of episodes) {
                        let epName = ep.text?.trim() || ''
                        let epUrl = this.combineUrl(ep.attributes['href'] || '')
                        vod_play_url += `${epName}$${epUrl}#`
                    }
                    vod_play_url += '$$$'
                    vod_play_from += `${from}$$$`
                }
                let detModel = new VideoDetail()
                detModel.vod_name = vod_name
                detModel.vod_pic = this.getFullImgUrl(vod_pic)
                detModel.vod_content = vod_content
                detModel.vod_year = vod_year
                detModel.vod_area = vod_area
                detModel.vod_lang = vod_lang
                detModel.type_name = type_name
                detModel.vod_play_from = vod_play_from.slice(0, -3)
                detModel.vod_play_url = vod_play_url.slice(0, -3)
                detModel.vod_id = webUrl
                backData.data = detModel
            }
        } catch (error) {
            backData.error = '获取视频详情失败' + error.message
        }
        return JSON.stringify(backData)
    }

    async getVideoPlayUrl(args) {
        let backData = new RepVideoPlayUrl()
        try {
            let reqUrl = this.combineUrl(args.url)
            let pro = await req(reqUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let url = ''
                if (/dujia/.test(proData)) {
                    let encrypted = proData.split("PPPP = '")[1]?.split("';")[0] || ''
                    if (encrypted) {
                        const key = CryptoJS.enc.Utf8.parse("Isu7fOAvI6!&IKpAbVdhf&^F")
                        const dataObj = { ciphertext: CryptoJS.enc.Base64.parse(encrypted) }
                        const decrypted = CryptoJS.AES.decrypt(dataObj, key, {
                            mode: CryptoJS.mode.ECB,
                            padding: CryptoJS.pad.Pkcs7,
                        })
                        url = decrypted.toString(CryptoJS.enc.Utf8)
                    }
                } else {
                    let match = proData.match(/src:\s*["']([^"']+)["']/)
                    if (match) url = match[1]
                }
                backData.data = url
                backData.headers = {
                    'Referer': this.webSite + '/',
                    'User-Agent': this.headers['User-Agent'],
                }
            }
        } catch (error) {
            backData.error = error.message
        }
        return JSON.stringify(backData)
    }

    async searchVideo(args) {
        let backData = new RepVideoList()
        try {
            await this.initCookie()
            let homePage = await req(this.webSite, { headers: this.headers })
            let tValue = ''
            if (homePage.data) {
                let match = homePage.data.match(/name="t"[^>]*value="([^"]*)"/i)
                if (match) tValue = encodeURIComponent(match[1])
            }
            let searchUrl = `${this.webSite}/search?k=${encodeURIComponent(args.searchWord)}&page=${args.page || 1}&t=${tValue}`
            let pro = await req(searchUrl, { headers: this.headers })
            backData.error = pro.error
            let proData = pro.data
            if (proData) {
                let document = parse(proData)
                let allVideo = document.querySelectorAll('.search-result-item')
                let videos = []
                for (let element of allVideo) {
                    let vodUrl = element.querySelector('a')?.attributes['href'] || ''
                    let vodPic = element.querySelector('img')?.attributes['data-original'] || ''
                    let vodName = element.querySelector('img')?.attributes['alt'] || ''
                    let vodDiJiJi = element.querySelector('.search-result-item-header')?.text?.trim() || ''
                    let videoDet = new VideoDetail()
                    videoDet.vod_id = this.combineUrl(vodUrl)
                    videoDet.vod_pic = this.getFullImgUrl(vodPic)
                    videoDet.vod_name = vodName
                    videoDet.vod_remarks = vodDiJiJi
                    videos.push(videoDet)
                }
                backData.data = videos
            }
        } catch (error) {
            backData.error = '搜索失败～' + error.message
        }
        return JSON.stringify(backData)
    }

    async initCookie() {
        if (this.headers.Cookie && this.headers.Cookie.includes('cdndefend_js_cookie')) {
            return
        }
        try {
            let homePage = await req(this.webSite, { headers: this.headers })
            if (homePage.data) {
                let hashMatch = homePage.data.match(/a0_0x2a54\s*=\s*\['([^']+)'/)
                if (hashMatch) {
                    let hash = hashMatch[1]
                    let idx = parseInt('0x' + hash[0], 16)
                    for (let i = 0; i < 1000000; i++) {
                        let input = hash + i
                        let sha1 = CryptoJS.SHA1(input).toString(CryptoJS.enc.Latin1)
                        if (sha1.charCodeAt(idx) === 0xb0 && sha1.charCodeAt(idx + 1) === 0x0b) {
                            this.headers.Cookie = `cdndefend_js_cookie=${input}`
                            break
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Cookie初始化失败:', e.message)
        }
    }

    combineUrl(url) {
        if (!url) return ''
        if (url.indexOf(this.webSite) !== -1) return url
        if (url.startsWith('/')) return this.webSite + url
        return this.webSite + '/' + url
    }

    getFullImgUrl(url) {
        if (!url) return ''
        if (url.startsWith('http')) return url
        if (url.startsWith('//')) return 'https:' + url
        return this.webSite + url
    }

    isIgnoreClassName(className) {
        let ignoreList = ['Netflix', '今日更新', '专题列表', '排行榜', '首页']
        return ignoreList.some(item => className.includes(item))
    }
}

var kkys0120240612 = new kkys01Class()
