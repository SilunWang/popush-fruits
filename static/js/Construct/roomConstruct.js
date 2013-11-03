//////////////////////// RoomConstruct //////////////////////////////

/************************************************************************
| 函数名称： RoomConstruct
| 函数功能： 包装了room通用函数
| 引用： globalModel roomModel roomObj msgObj editorObj 几个Controller
| Author: SilunWang
*************************************************************************/

var RoomConstruct = can.Construct.extend ({}, {

        //当前页面的模型
        roomModel: undefined,
        //全局模型
        globalModel: undefined,
        //处理一些socket消息的Construct
        msgObj: undefined,
        //控制运行和调试的Construct
        runObj: undefined,
        //控制编辑区的Construct
        editorObj: undefined,
        //toolbar
        toolbarController: undefined,
        //chatbox + console
        chatboxController: undefined,
        //varlist
        varlistController: undefined,

        init: function(options) {

                this.roomModel = options.roomModel;
                this.globalModel = options.globalModel;
                
                this.msgObj = new MessageConstruct({
                        roomModel: this.roomModel,
                        globalModel: this.globalModel,
                        roomObj: this
                });

                this.runObj = new RunCodeConstruct({
                        roomModel: this.roomModel,
                        globalModel: this.globalModel,
                        roomObj: this
                });

                this.editorObj = new EditorConstruct({
                        roomModel:this.roomModel,
                        globalModel:this.globalModel,
                        roomObj:this
                });

                this.toolbarController = new ToolbarController("#over-editor", {
                        roomObj: this,
                        globalModel: this.globalModel,
                        roomModel: this.roomModel,
                        msgObj: this.msgObj,
                        runObj: this.runObj,
                        editorObj: this.editorObj
                });

                this.varlistController = new VarlistController("#varlist", {
                        roomObj: this,
                        globalModel: this.globalModel,
                        roomModel: this.roomModel,
                        runObj: this.runObj,
                        msgObj: this.msgObj
                });

                this.chatboxController = new ChatboxController('#chatbox', {
                        roomObj: this,
                        globalModel: this.globalModel,
                        roomModel: this.roomModel,
                        runObj: this.runObj,
                        msgObj: this.msgObj
                });

                this.consoleController = new ConsoleController('#console', {
                        globalModel: this.globalModel,
                        roomModel: this.roomModel,
                        roomObj: this,
                        runObj: this.runObj
                });

                this.initModelData();
                this.socket_on_set(this.globalModel.socket);
                this.registereditorevent();
        },

        //初始化模型中的一些数据
        initModelData: function() {

                var localThis = this;

                //将修改出队的函数
                this.roomModel.vars.q._shift = this.roomModel.vars.q.shift;
                this.roomModel.vars.q.shift = function() {
                        var r = this._shift();
                        if (this.length == 0 && localThis.roomModel.vars.bufferfrom == -1) {
                                //如果本地的修改已经处理完毕，则标记已保存
                                localThis.editorObj.setsaved();
                        }
                        return r;
                }
                //将修改入队的函数
                this.roomModel.vars.q._push = this.roomModel.vars.q.push;
                this.roomModel.vars.q._push = function(element) {
                        this._push(element);
                        localThis.editorObj.setsaving();
                }
        },

        //控制页面上的运行、调试按钮的可用性
        setrunanddebugstate: function() {
                //解除禁止状态
                $('#editor-run').removeClass('disabled');
                $('#editor-debug').removeClass('disabled');
                //如果不可运行，则禁用运行按钮
                if (!this.roomModel.runenabled())
                        $('#editor-run').addClass('disabled');
                //如果不可调试，则禁用调试按钮
                if (!this.roomModel.debugenabled())
                        $('#editor-debug').addClass('disabled');
        },

        //新建一个光标
        newcursor: function(content) {
                
                var cursor = $(
                        '<div class="cursor">' +
                        '<div class="cursor-not-so-inner">' +
                        '<div class="cursor-inner">' +
                        '<div class="cursor-inner-inner">' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                ).get(0);

                $(cursor).find('.cursor-inner').popover({
                        html: true,
                        content: '<b>' + content + '</b>',
                        placement: 'bottom',
                        trigger: 'hover'
                });
                return cursor;
        },

        //打开编辑界面的时候会调用，o：关于打开的文件的信息
        openeditor: function(o) {
                if (this.globalModel.operationLock)
                        return;
                this.globalModel.operationLock = true;
                this.globalModel.filelist.loading();
                this.roomModel.vars.docobj = o;
                this.globalModel.socket.emit('join', {
                        path: o.path
                });
        },

        togglechat: function(o) {
                var roomVars = this.roomModel.vars;
                if (this.globalModel.viewswitchLock)
                        return;
                if (roomVars.chatstate) {
                        $('#editormain').parent().removeClass('span12');
                        $('#editormain').parent().addClass('span9');
                        $('#chatbox').show();
                        $(o).html('<i class="icon-forward"></i>');
                        $(o).attr('title', this.globalModel.strings['hide-title']);
                } else {
                        $('#chatbox').hide();
                        $('#editormain').parent().removeClass('span9');
                        $('#editormain').parent().addClass('span12');
                        $(o).html('<i class="icon-backward"></i>');
                        $(o).attr('title', this.globalModel.strings['show-title']);
                }
                var o = $('#chat-show').get(0);
                o.scrollTop = o.scrollHeight;
                roomVars.editor.refresh();
                this.resize();
                roomVars.chatstate = !roomVars.chatstate;
        },

        //将聊天的内容显示到屏幕上
        //name:发送消息的人，可能是“系统消息”
        //type:自己-“self”，系统-“system”，其它人-“”
        //time:消息的时间
        appendtochatbox: function(name, type, content, time) {
                $('#chat-show-inner').append(
                        '<p class="chat-element"><span class="chat-name ' + type +
                        '">' + name + '&nbsp;&nbsp;' + time.toTimeString().substr(0, 8) + '</span><br />' + content + '</p>'
                );
                var o = $('#chat-show').get(0);
                o.scrollTop = o.scrollHeight;
        },

        //将文字内容放到控制台
        //content:文字内容
        //type:类型，输入为stdin，错误stderr，其它undefined
        appendtoconsole: function(content, type) {
                if (type) {
                        type = ' class="' + type + '"';
                } else {
                        type = '';
                }
                $('#console-inner').append(
                        '<span' + type + '">' + this.globalModel.htmlescape(content) + '</span>'
                );
                var o = $('#console-inner').get(0);
                o.scrollTop = o.scrollHeight;
        },

        //点击“控制台”按钮时触发的响应函数，变更控制台的开关状态
        toggleconsole: function() {
                if (this.roomModel.vars.consoleopen)
                {
                        this.closeconsole();
                }
                else{
                        this.openconsole();
                }
        },

        //关闭控制台显示，不清除控制台内容
        closeconsole: function() {
                if (!this.roomModel.vars.consoleopen)
                        return;
                this.roomModel.vars.consoleopen = false;
                $('#under-editor').hide();
                $('#editor-console').removeClass('active');
                this.resize();
        },

        //打开控制台显示，不清除控制台内容
        openconsole: function() {
                if (!this.roomModel.vars.consoleopen) {
                        this.roomModel.vars.consoleopen = true;
                        $('#under-editor').show();
                        $('#editor-console').addClass('active');
                        this.resize();
                }
                $('#console-input').focus();
        },

        isFullScreen: function(cm) {
                return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
        },

        //调整代码编辑页面各个元素的大小以供合理显示
        //cbh : chat box height
        //$('#member-list-doc') : 共享用户头像列表
        //$('#under-editor') : 调试和控制台
        resize: function() {
                var w;
                var h = $(window).height();
                if (h < 100)
                        h = 100;
                var cbh = h - $('#member-list-doc').height() - 138;
                //保证chat box有一定的宽度
                var cbhexp = cbh > 100 ? 0 : 100 - cbh;
                if (cbh < 100)
                        cbh = 100;
                $('#chat-show').css('height', cbh + 'px');
                $('#chatbox').css('height', (h - 83 + cbhexp) + 'px');
                w = $('#editormain').parent().width();
                $('#editormain').css('width', w);
                var underh = h > 636 ? 212 : h / 3;
                if (!this.roomModel.vars.consoleopen)
                        underh = 0;
                $('#under-editor').css('height', underh + 'px');
                $('#console').css('width', (w - w / 3 - 2) + 'px');
                $('#varlist').css('width', (w / 3 - 1) + 'px');
                $('#console').css('height', (underh - 12) + 'px');
                $('#varlist').css('height', (underh - 12) + 'px');
                $('#varlistreal').css('height', (underh - 42) + 'px');
                $('#console-inner').css('height', (underh - 81) + 'px');
                $('#console-input').css('width', (w - w / 3 - 14) + 'px');
                if (!this.isFullScreen(this.roomModel.vars.editor))
                        $('.CodeMirror').css('height', (h - underh - $('#over-editor').height() - 90) + 'px');
                w = $('#chat-show').width();
                if (w != 0)
                        $('#chat-input').css('width', (w - 70) + 'px');

                $('#file-list .span10').css('min-height', (h - 235) + 'px');

                w = $('#login-box').parent('*').width();
                $('#login-box').css('left', ((w - 420) / 2 - 30) + 'px');
                w = $('#register-box').parent('*').width();
                $('#register-box').css('left', ((w - 420) / 2 - 30) + 'px');
                $('#fullscreentip').css('left', (($(window).width() - $('#fullscreentip').width()) / 2) + 'px');

                $('#editormain-inner').css('left', (-$(window).scrollLeft()) + 'px');

                this.roomModel.vars.editor.refresh();
        },

        //给CodeMirror添加监听者
        //即，在代码编辑器上的变动能够被对应函数响应
        //在网页启动的时候调用
        registereditorevent: function() {

                var vars = this.roomModel.vars;
                var editor = vars.editor;
                var localThis = this;

                //chg（例子） : Object {from: Pos, to: Pos, text: Array[5], origin: "setValue", removed: Array[7]}
                //text : 新打开的文档内容
                //removed : 上次打开的文档内容
                //editorDoc(例子) : window.CodeMirror.CodeMirror.Doc {children: Array[1], size: 5, height: 2352, parent: null, first: 0…}
                CodeMirror.on(editor.getDoc(), 'change', function(editorDoc, chg) {

                        if (vars.debugLock) {
                                return true;
                        }

                        if (vars.lock) {
                                vars.lock = false;
                                return true;
                        }

                        var cfrom = editor.indexFromPos(chg.from);
                        var cto = editor.indexFromPos(chg.to);
                        var removetext = "";
                        for (var i = 0; i < chg.removed.length - 1; i++) {
                                removetext += chg.removed[i] + '\n';
                        }
                        removetext += chg.removed[chg.removed.length - 1];
                        cto = cfrom + removetext.length;
                        var cattext = "";
                        for (var i = 0; i < chg.text.length - 1; i++) {
                                cattext += chg.text[i] + '\n';
                        }
                        cattext += chg.text[chg.text.length - 1];

                        var delta = cfrom + cattext.length - cto;

                        for (var k in vars.cursors) {
                                if (cto <= vars.cursors[k].pos) {
                                        vars.cursors[k].pos += delta;
                                        editor.addWidget(editor.posFromIndex(vars.cursors[k].pos), vars.cursors[k].element, false);
                                } else if (cfrom < vars.cursors[k].pos) {
                                        vars.cursors[k].pos = cfrom + cattext.length;
                                        editor.addWidget(editor.posFromIndex(vars.cursors[k].pos), vars.cursors[k].element, false);
                                }
                        }

                        var bfrom = chg.from.line;
                        var bto = chg.to.line;

                        if (chg.text.length != (bto - bfrom + 1)) {
                                localThis.editorObj.sendbuffer();
                                var req = {
                                        version: vars.doc.version,
                                        from: cfrom,
                                        to: cto,
                                        text: cattext
                                };
                                if (vars.q.length == 0) {
                                        socket.emit('change', req);
                                }
                                vars.q.push(req);
                                var btext = "";
                                for (var i = 0; i < chg.text.length; i++) {
                                        btext += localThis.runObj.havebreakat(editor, bfrom + i);
                                }
                                localThis.runObj.sendbreak(bfrom, bto + 1, btext);
                                return;
                        }
                        if (chg.text.length > 1) {
                                vars.buffertimeout = vars.buffertimeout / 2;
                        }
                        if (vars.bufferto == -1 && cfrom == cto &&
                                (cfrom == vars.bufferfrom + vars.buffertext.length || vars.bufferfrom == -1)) {
                                if (vars.bufferfrom == -1) {
                                        vars.buffertext = cattext;
                                        vars.bufferfrom = cfrom;
                                } else {
                                        vars.buffertext += cattext;
                                }
                                localThis.editorObj.save();
                                return;
                        } else if (vars.bufferto == -1 && chg.origin == "+delete" &&
                                vars.bufferfrom != -1 && cto == vars.bufferfrom + vars.buffertext.length && cfrom >= vars.bufferfrom) {
                                vars.buffertext = vars.buffertext.substr(0, cfrom - vars.bufferfrom);
                                if (vars.buffertext.length == 0) {
                                        vars.bufferfrom = -1;
                                        if (vars.q.length == 0) {
                                                localThis.editorObj.setsaved();
                                        }
                                        return;
                                }
                                localThis.editorObj.save();
                                return;
                        } else if (chg.origin == "+delete" &&
                                vars.bufferfrom == -1) {
                                vars.bufferfrom = cfrom;
                                vars.bufferto = cto;
                                vars.buffertext = "";
                                localThis.editorObj.save();
                                return;
                        } else if (vars.bufferto != -1 && chg.origin == "+delete" &&
                                cto == vars.bufferfrom) {
                                vars.bufferfrom = cfrom;
                                localThis.editorObj.save();
                                return;
                        } else if (vars.bufferfrom != -1) {
                                if (vars.bufferto == -1) {
                                        var req = {
                                                version: vars.doc.version,
                                                from: vars.bufferfrom,
                                                to: vars.bufferfrom,
                                                text: vars.buffertext
                                        };
                                        if (vars.q.length == 0) {
                                                socket.emit('change', req);
                                        }
                                        vars.q.push(req);
                                        vars.buffertext = "";
                                        vars.bufferfrom = -1;
                                } else {
                                        var req = {
                                                version: vars.doc.version,
                                                from: vars.bufferfrom,
                                                to: vars.bufferto,
                                                text: vars.buffertext
                                        };
                                        if (vars.q.length == 0) {
                                                socket.emit('change', req);
                                        }
                                        vars.q.push(req);
                                        vars.bufferfrom = -1;
                                        vars.bufferto = -1;
                                }
                        }

                        var req = {
                                version: vars.doc.version,
                                from: cfrom,
                                to: cto,
                                text: cattext
                        };
                        if (vars.q.length == 0) {
                                socket.emit('change', req);
                        }
                        vars.q.push(req);
                });
        },

        //关闭编辑界面后的相关操作
        closeeditor: function() {
                var localThis = this;
                this.globalModel.socket.emit('leave', {});

                this.globalModel.backhome.refreshfilelist(function()
                        {;}, function() {
                        $("body").animate({
                                scrollTop: localThis.roomModel.vars.oldscrolltop
                        });
                });

                this.msgObj.leaveVoiceRoom();
        },

        //点击运行时的界面控制
        setrun: function() {
                this.roomModel.vars.runLock = true;
                $('#editor-run').html('<i class="icon-stop"></i>');
                $('#editor-run').attr('title', this.globalModel.strings['kill-title']);
                $('#console-inner').html('');
                $('#console-input').val('');
                $('#editor-debug').addClass('disabled');
                $('#console-title').text(this.globalModel.strings['console']);
                this.openconsole();
        },

        //调试一个程序时的界面控制
        setdebug: function() {
                this.roomModel.vars.debugLock = true;
                $('#editor-debug').html('<i class="icon-eye-close"></i>');
                $('#editor-debug').attr('title', this.globalModel.strings['stop-debug-title']);
                $('#console-inner').html('');
                $('#console-input').val('');
                $('#editor-run').addClass('disabled');
                $('#console-title').text(this.globalModel.strings['console']);
                this.openconsole();
        },

        changelanguage: function(language) {
                if (languagemap[language]) {
                        if (modemap[language])
                                this.roomModel.vars.editor.setOption('mode', modemap[language]);
                        else
                                this.roomModel.vars.editor.setOption('mode', languagemap[language]);
                        CodeMirror.autoLoadMode(this.roomModel.vars.editor, languagemap[language]);
                } else {
                        this.roomModel.vars.editor.setOption('mode', 'text/plain');
                        CodeMirror.autoLoadMode(this.roomModel.vars.editor, '');
                }
        },

        //进入编辑界面时，显示各种数据
        //data : {id, users(hongyu:true, hongdashen:true), version, text, bps, exprs(监视列表的表达式{变量：值})}
        socket_on_set: function(socket) {

                var localThis = this;
                var vars = this.roomModel.vars;

                socket.on('set', function(data) {

                        vars.savetimestamp = 1;
                        localThis.editorObj.setsavedthen(1);

                        vars.q.length = 0;
                        vars.bq.length = 0;
                        vars.lock = false;

                        $('#editor-run').html('<i class="icon-play"></i>');
                        $('#editor-run').attr('title', localThis.globalModel.strings['run-title']);
                        vars.runLock = false;
                        vars.debugLock = false;
                        vars.waiting = false;

                        $('#current-doc').html(localThis.globalModel.htmlescape(vars.docobj.showname));
                        $('#chat-input').val('');
                        $('#chat-show-inner').text('');
                        $('#editor').show();
                        $('#filecontrol').hide();
                        $('#footer').hide();
                        var filepart = vars.docobj.name.split('.');
                        vars.ext = filepart[filepart.length - 1];
                        localThis.changelanguage(vars.ext);
                        localThis.runObj.checkrunanddebug(vars.ext);

                        vars.editor.refresh();

                        if (localThis.globalModel.currentDir.length == 1) {
                                localThis.globalModel.memberlistdoc.fromdoc(vars.docobj);
                        }
                        localThis.globalModel.memberlistdoc.setalloffline();
                        localThis.globalModel.memberlistdoc.setonline(localThis.globalModel.currentUser.name, true);

                        for (var k in vars.cursors) {
                                $(vars.cursors[k].element).remove();
                        }

                        vars.cursors = {};

                        vars.oldscrolltop = $('body').scrollTop();

                        window.voiceon = false;
                        window.voiceLock = false;
                        window.userArray = [];
                        window.audioArray = {};
                        window.joinedARoom = false;
                        window.peerArray = {};
                        window.peerUserArray = [];

                        $('#voice-on').removeClass('active');

                        localThis.globalModel.operationLock = false;

                        vars.lock = true;
                        vars.doc = data;
                        localThis.roomModel.vars.editor.setValue(vars.doc.text);
                        localThis.roomModel.vars.editor.clearHistory();
                        localThis.roomModel.vars.editor.setOption('readOnly', false);
                        localThis.runObj.initbreakpoints(data.bps);
                        for (var i in data.users) {
                                localThis.globalModel.memberlistdoc.setonline(i, true);
                                if (i == localThis.globalModel.currentUser.name)
                                        continue;
                                var cursor = localThis.newcursor(i);
                                if (vars.cursors[i] && vars.cursors[i].element)
                                        $(vars.cursors[i].element).remove();
                                vars.cursors[i] = {
                                        element: cursor,
                                        pos: 0
                                };
                        }
                        localThis.globalModel.memberlistdoc.sort();

                        localThis.globalModel.filelist.removeloading();
                        $('#console-inner').html('');
                        localThis.closeconsole();
                        localThis.globalModel.expressionlist.clear();
                        for (var k in data.exprs) {
                                localThis.globalModel.expressionlist.addExpression(k);
                                localThis.globalModel.expressionlist.setValue(k, data.exprs[k]);
                        }

                        $('#console-title').text(localThis.globalModel.strings['console']);

                        localThis.resize();
                        $('body').scrollTop(99999);

                        if (data.running) {
                                localThis.setrun();
                        }
                        if (data.debugging) {
                                localThis.setdebug();
                                localThis.roomModel.vars.editor.setOption('readOnly', true);
                                vars.old_text = data.text;
                                vars.old_bps = data.bps;
                                if (data.state == 'waiting') {
                                        vars.waiting = true;
                                        localThis.runObj.runtoline(data.line - 1);
                                        $('.debugandwait').removeClass('disabled');
                                        if (data.line !== null)
                                                $('#console-title').text(localThis.globalModel.strings['console'] + localThis.globalModel.strings['waiting']);
                                        else
                                                $('#console-title').text(localThis.globalModel.strings['console'] + localThis.globalModel.strings['waiting'] + localThis.globalModel.strings['nosource']);
                                }
                        }
                        localThis.setrunanddebugstate();

                        delete data.running;
                        delete data.debugging;
                        delete data.state;
                });
        },

        //添加断点的响应函数
        gutterclick: function(cm, n) {}
        
});
