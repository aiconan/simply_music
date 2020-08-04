mdui.JQ(function(){
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
            none_lyric: ["","","","纯音乐，供您欣赏"],
            tlyric: null,
            playnow: false,
            loading_done: false,
            moving: -0,
            currentTime: 0,
            lyricTime: 0,
            alltime: 0,
            set_volume: false,
            volume: 80,
            s_loading: false,
            s_id: false,
            s_data: null,
            s_text: '',
            s_page: 1
        },
        updated: function(){
            mdui.updateSliders();
            mdui.mutation();
            main_scroll.refresh();
            var s_dialog = new mdui.Dialog('s_dialog');
            s_dialog.handleUpdate();
        },
        mounted: function(){
            if(this.isMobile()){
                var r = mdui.JQ("header").height();
                mdui.JQ(".mdui-toolbar").attr("style", "height:"+r+"px!important");
            }
            var scroll = {
                mouseWheel: true,
                click: false
            };
            main_scroll = new IScroll("main", scroll);
            mdui.JQ(".loading_page").remove();
            mdui.JQ("#app").show();
            this.setvolume(localStorage.volume || 80);
            this.player(this.getQueryString("id") || 38592976);
        },
        methods: {
            search: function(text){
                if (!text || (text == this.s_text && this.s_page == 1)) return false;
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
                        app.s_data = false;
                    },
                    success: function(data){
                        app.s_loading = false;
                        app.s_data = JSON.parse(data).result.songs;
                        app.s_page += 1;
                    }
                })
            },
            player: function(id){
                if (id == this.id) return false;
                this.lyric = ["","","","加载中，请稍候……"];
                this.tlyric = null;
                this.loading_done = false;
                this.s_id = id; 
                mdui.JQ.ajax({
                    url: this.api + "song/detail",
                    data: {
                        ids: id
                    },
                    method: "GET",
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
                        mdui.JQ("link[rel=\"shortcut icon\"]").attr("href",app.picurl);
                        app.loading_done = true;
                        app.s_id = false;
                    }
                })
            },
            canplay: function(){
                this.alltime = parseInt(this.$refs.player.duration);
                var t = this.name+" - "+this.artist;
                document.title = "▶ " +t;
                if (navigator.userAgent.toLowerCase().match(/MicroMessenger/i) == null) {
                    history.pushState(null, null, '?id='+this.id);
                }
            },
            isMobile: function(){
                var ua = navigator.userAgent;
                var ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
                isIphone =!ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
                isAndroid = ua.match(/(Android)\s+([\d.]+)/),
                isMobile = isIphone || isAndroid;
                return isMobile;
            },
            play: function(t){
                if (app.$refs.player.paused || t =="play") {
                    app.$refs.player.play();
                    app.playnow = true;
                    this.alltime = parseInt(app.$refs.player.duration);
                    app.$refs.player.ontimeupdate = function() {
                        app.currentTime =  Math.round(app.$refs.player.currentTime);
                        if(parseInt(app.$refs.player.currentTime) == app.alltime) {
                            app.$refs.player.currentTime = 0;
                            app.play("play");
                        }
                        if(app.lyric && app.tlyric !== app.none_lyric) {
                            for (name in app.lyric) {
                                if (name == app.currentTime) {
                                    app.main_moving();
                                }
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
                if(app.lyric && app.tlyric !== app.none_lyric) {
                    for (name in app.lyric) {
                        if (name <= app.currentTime) {
                            app.main_moving();
                        }
                    }
                }
            },
            main_moving: function(){
                this.lyricTime = name;
                if (this.tlyric) {
                    var lo = mdui.JQ(".info_lyric>div").length - 5;
                    var co = mdui.JQ("div[time='"+name+"']").index() - 2;
                    if(co > 0 && co < lo) {
                        t = -56*co;
                    } else if(co > lo-1) {
                        t = -56*lo+10;
                    } else if(co == -2) {
                        t = 0;
                    }
                } else {
                    var lo = mdui.JQ(".info_lyric>div").length - 8;
                    var co = mdui.JQ("div[time='"+name+"']").index() - 3;
                    if(co > 0 && co < lo) {
                        t = -38*co;
                    } else if(co > lo-1) {
                        t = -38.18*lo+10;
                    } else if (co == -3) {
                        t = 0;
                    }
                }
                if(t !== this.moving) {
                    this.moving = t;
                    main_scroll.scrollTo(0, this.moving, 300);
                }
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
                            app.lyric = app.none_lyric;
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
                this.volume = value;
                this.$refs.player.volume = this.volume / 100;
                localStorage.volume = this.volume;
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
            save: function(url, filename){
                window.open(url);
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
});
