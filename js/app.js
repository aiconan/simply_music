var app = new Vue({
    el: '#app',
    data: {
        api: 'https://neteaseapi.avosapps.us/',
        id: null,
        data: null,
        name: "Music",
        artist: "Loading",
        album: null,
        url: null,
        picurl: null,
        bgurl: null,
        lyric: ["","","","加载中，请稍候……"],
        tlyric: null,
        playnow: false,
        loading_done: false,
        moving: 0,
        currentTime: 0,
        alltime: 0,
        set_volume: false,
        volume: 100,
        s_loading: false,
        s_data: null,
        s_text: '',
        s_page: 1
    },
    methods: {
        search: function(text){
            if (!text) {
                return false;
            }
            mdui.JQ.ajax({
                url: this.api + "search",
                data: {
                    keywords: text,
                    limit: 6,
                    type: 1,
                    offset: (app.s_page - 1) * 6
                },
                method: "GET",
                beforeSend: function(){
                    app.s_loading = true;
                },
                success: function(data){
                    app.s_loading = false;
                    app.s_data = JSON.parse(data).result.songs;
                    app.s_page += 1;
                    setTimeout(() => {
                        s_scroll.refresh();
                    }, 0);
                }
            })
        },
        player: function(id){
            mdui.JQ.ajax({
                url: this.api + "song/detail",
                data: {
                    ids: id
                },
                method: "GET",
                beforeSend: function() {
                    if (id == app.id) return false;
                    app.lyric = ["","","","加载中，请稍候……"];
                    app.loading_done = false;
                },
                success: function(data) {
                    app.id = id;
                    app.data = JSON.parse(data);
                    var data = app.data.songs[0];
                    app.name = data.name;
                    app.album = data.al.name;
                    app.artist = "";
                    for (var i in data.ar) {
                        if (i == data.ar.length - 1) {
                            app.artist += data.ar[i].name;
                        } else {
                            app.artist += data.ar[i].name + ", ";
                        }
                    }
                    app.url = "https://music.163.com/song/media/outer/url?id=" + id + ".mp3";
                    app.picurl = data.al.picUrl;
                    if (data.al.pic_str) {
                        app.bgurl = "https://music.163.com/api/img/blur/" + data.al.pic_str;
                    } else {
                        app.bgurl = "https://music.163.com/api/img/blur/" + data.al.pic;
                    }
                    app.getlyric(id);
                    app.$refs.player.pause();
                    app.playnow = false;
                    app.$refs.player.load();
                    mdui.updateSliders();
                    setTimeout(() => {
                        d_scroll.refresh();
                    }, 0);
                    mdui.JQ("link[rel=\"shortcut icon\"]").attr("href",app.picurl);
                    app.loading_done = true;
                }
            })
        },
        canplay: function(){
            this.alltime = parseInt(this.$refs.player.duration);
            document.title = "▶ " +this.name+" - "+this.artist;
            if (navigator.userAgent.toLowerCase().match(/MicroMessenger/i) !== "micromessenger") {
                history.pushState(null, null, '?id='+this.id);
            }
            setTimeout("mdui.updateSliders()", 1000);
        },
        play: function(t){
            if (app.$refs.player.paused || t =="play") {
                app.$refs.player.play();
                app.playnow = true;
                this.alltime = parseInt(app.$refs.player.duration);
                mdui.updateSliders(".changetime");
                app.$refs.player.ontimeupdate = function() {
                    app.currentTime =  Math.round(app.$refs.player.currentTime);
                    mdui.updateSliders(".changetime");
                    if(parseInt(app.$refs.player.currentTime) == app.alltime) {
                        app.$refs.player.currentTime = 0;
                        app.play("play");
                    }
                    for (name in app.lyric) {
                        if (name == app.currentTime) {
                            mdui.JQ(".info_lyric>div").attr("class", "lyric_box");
                            mdui.JQ("div[time = '" + name + "']").addClass("show");
                            if (app.tlyric) {
                                var lo = mdui.JQ(".info_lyric>div").length - 4;
                                var co = mdui.JQ("div[time='"+name+"']").index() - 2;
                                if(co > 0 && co < lo) {
                                    app.moving = -56*co;
                                } else if(co > lo) {
                                    app.moving = -56*(co-2);
                                } else if(co == -2) {
                                    app.moving = 0;
                                }
                            } else {
                                var lo = mdui.JQ(".info_lyric>div").length - 6;
                                var co = mdui.JQ("div[time='"+name+"']").index() - 3;
                                if(co > 0 && co < lo) {
                                    app.moving = -38*co;
                                } else if(co > lo) {
                                    app.moving = -38*(co-3);
                                } else if (co == -2) {
                                    app.moving = 0;
                                }
                            }
                            main_scroll.scrollTo(0, app.moving, 300);
                        }
                    }
                }
            } else {
                app.$refs.player.pause();
                app.playnow = false;
            }
        },
        change: function(value){
            this.$refs.player.currentTime = value;
            mdui.updateSliders();
        },
        getlyric: function(id){
            mdui.JQ.ajax({
                url: this.api + "lyric",
                data: {
                    id: id
                },
                success: function(data) {
                    var data = JSON.parse(data);
                    if (data.nolyric === true) {
                        app.lyric = ["","","","纯音乐，供您欣赏"];
                    } else {
                        app.lyric = app.parseLyric(data.lrc.lyric);
                    }
                    if (data.tlyric.lyric) {
                        app.tlyric = app.parseLyric(data.tlyric.lyric);
                    } else {
                        app.tlyric = "";
                    }
                    setTimeout(() => {
                        main_scroll.refresh();
                    }, 0);
                }
            })
        },
        setvolume: function(value) {
            this.$refs.player.volume = this.volume / 100;
        },
        parseLyric: function(lrc){
            var lyrics = lrc.split("\n");
            var lrcObj = {};
            for(var i=0;i<lyrics.length;i++){
                var lyric = decodeURIComponent(lyrics[i]);
                var timeReg = /\[\d*:\d*((\.|\:)\d*)*\]/g;
                var timeRegExpArr = lyric.match(timeReg);
                if(!timeRegExpArr)continue;
                var clause = lyric.replace(timeReg,'');
                for(var k = 0,h = timeRegExpArr.length;k < h;k++) {
                    var t = timeRegExpArr[k];
                    var min = Number(String(t.match(/\[\d*/i)).slice(1)),
                    sec = Number(String(t.match(/\:\d*/i)).slice(1));
                    var time = min * 60 + sec;
                    lrcObj[time] = clause;
                }
            }
            return lrcObj;
        },
        s_to_hs: function(seconds){
            var min = Math.floor(seconds / 60),
            second = seconds % 60,
            hour, newMin, time;
            if (min > 60) {
                hour = Math.floor(min / 60);
                newMin = min % 60;
            }
            if (second < 10) { second = '0' + second;}
            if (min < 10) { min = '0' + min;}
            var time = hour? (hour + ':' + newMin + ':' + second) : (min + ':' + second);
            return time.substring(0,5);;
        },
        getQueryString: function(name){ 
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"); 
            var r = window.location.search.substr(1).match(reg);
            if (r != null) return decodeURI(r[2]);
            return null;
        }
    },
});

var t = mdui.JQ(window).height();
var r = mdui.JQ("header").height();
mdui.JQ("body").height(t + "px");
mdui.JQ("#app").height(t*0.84 + "px");
mdui.JQ(".mdui-toolbar").attr("style","height:"+r+"px!important");
mdui.JQ(".s_result").height(t*0.4 + "px");
var scroll = {
    mouseWheel: true
};
var main_scroll = new IScroll("main", scroll);
var s_scroll = new IScroll(".s_result", scroll);
var d_scroll = new IScroll(".d_detail", scroll);
app.player(app.getQueryString("id") || 38592976);