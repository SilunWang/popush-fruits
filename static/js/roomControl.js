//Room部分的通用Controller

var RoomController = can.Control.extend ({

	//当前页面的模型
	roomModel: undefined,
	//全局模型
	globalModel: undefined,
	//处理一些socket消息的控制器
	socketController: undefined,
	//控制运行和调试的控制器
	run_debugController: undefined,
	//控制编辑区的控制器
	editorController: undefined,
	//
	ejs_toolbarController: undefined,
	//
	ejs_chatboxController: undefined,
	//
	ejs_varlistController: undefined,
	//解决init函数this指针问题
	self: this,

	init: function(element, options) {
		self.roomModel = this.options.roomModel;
		self.globalModel = this.options.globalModel;
		
		self.socketController = new SocketController("", {roomModel:self.roomModel, globalModel:self.globalModel, roomController:this});
		self.run_debugController = new Run_debugController("", {roomModel:self.roomModel, globalModel:self.globalModel, roomController:this});
		self.editorController = new EditorController("", {roomModel:self.roomModel, globalModel:self.globalModel, roomController:this});

		self.ejs_toolbarController = new ToolbarController("#over-editor", {
			m_room_c: this, 
			m_global_v: self.globalModel,
			m_room_v: self.roomModel,
			m_socket_c: self.socketController
		});

		self.ejs_varlistController = new VarlistController("#varlist", {
			m_room_c: this, 
			m_global_v: self.globalModel,
			m_room_v: self.roomModel,
			m_rundebug_c:self.run_debugController,
			m_socket_c: self.socketController
		});

		self.ejs_chatboxController = new ChatboxController('#chatbox', {
			m_room_c: this, 
			m_global_v: self.globalModel,
			m_room_v: self.roomModel,
			m_rundebug_c:self.run_debugController,
			m_socket_c: self.socketController
		});

		this.initModelData();
		this.socket_on_set(globalModel.socket);
		this.registereditorevent();
	},

	//初始化模型中的一些数据
	initModelData: function() {
		//将修改出队的函数
		roomModel.vars.q._shift = roomModel.vars.q.shift;
		roomModel.vars.q.shift = function() {
			var r = this._shift();
			if (this.length == 0 && self.roomModel.vars.bufferfrom == -1) { // buffertext == "") {
				//如果本地的修改已经处理完毕，则标记已保存
				self.editorController.setsaved();
			}
			return r;
		}
		//将修改入队的函数
		self.roomModel.vars.q._push = self.roomModel.vars.q.push;
		self.roomModel.vars.q._push = function(element) {
			this._push(element);
			self.editorController.setsaving();
		}
	},

	//控制页面上的运行、调试按钮的可用性
	setrunanddebugstate: function() {
		//解除禁止状态
		$('#editor-run').removeClass('disabled');
		$('#editor-debug').removeClass('disabled');
		//如果不可运行，则禁用运行按钮
		if (!self.roomModel.runenabled())
			$('#editor-run').addClass('disabled');
		//如果不可调试，则禁用调试按钮
		if (!self.roomModel.debugenabled())
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
		if (self.globalModel.operationLock)
			return;
		self.globalModel.operationLock = true;
		self.globalModel.filelist.loading();
		self.roomModel.vars.docobj = o;
		self.globalModel.socket.emit('join', {
			path: o.path
		});
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
			'<span' + type + '">' + htmlescape(content) + '</span>'
		);
		var o = $('#console-inner').get(0);
		o.scrollTop = o.scrollHeight;
	},

	//点击“控制台”按钮时触发的响应函数，变更控制台的开关状态
	toggleconsole: function() {
		if (self.roomModel.vars.consoleopen) {
			this.closeconsole();
		} else {
			this.openconsole();
		}
	},

	//关闭控制台显示，不清除控制台内容
	closeconsole: function() {
		if (!self.roomModel.vars.consoleopen)
			return;
		self.roomModel.vars.consoleopen = false;
		$('#under-editor').hide();
		$('#editor-console').removeClass('active');
		this.resize();
	},

	//打开控制台显示，不清除控制台内容
	openconsole: function() {
		if (!self.roomModel.vars.consoleopen) {
			self.roomModel.vars.consoleopen = true;
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
		if (!self.roomModel.vars.consoleopen)
			underh = 0;
		$('#under-editor').css('height', underh + 'px');
		$('#console').css('width', (w - w / 3 - 2) + 'px');
		$('#varlist').css('width', (w / 3 - 1) + 'px');
		$('#console').css('height', (underh - 12) + 'px');
		$('#varlist').css('height', (underh - 12) + 'px');
		$('#varlistreal').css('height', (underh - 42) + 'px');
		$('#console-inner').css('height', (underh - 81) + 'px');
		$('#console-input').css('width', (w - w / 3 - 14) + 'px');
		if (!this.isFullScreen(self.globalModel.editor))
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

		self.globalModel.editor.refresh();
	},

	//给CodeMirror添加监听者
	//即，在代码编辑器上的变动能够被对应函数响应
	//在网页启动的时候调用
	registereditorevent: function() {

		var vars = self.roomModel.vars;
		var editor = self.globalModel.editor;
		var localThis = self;

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
				self.editorController.sendbuffer();
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
					btext += self.run_debugController.havebreakat(editor, bfrom + i);
				}
				self.run_debugController.sendbreak(bfrom, bto + 1, btext);
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
				self.editorController.save();
				return;
			} else if (vars.bufferto == -1 && chg.origin == "+delete" &&
				vars.bufferfrom != -1 && cto == vars.bufferfrom + vars.buffertext.length && cfrom >= vars.bufferfrom) {
				vars.buffertext = vars.buffertext.substr(0, cfrom - vars.bufferfrom);
				if (vars.buffertext.length == 0) {
					vars.bufferfrom = -1;
					if (vars.q.length == 0) {
						self.editorController.setsaved();
					}
					return;
				}
				self.editorController.save();
				return;
			} else if (chg.origin == "+delete" &&
				vars.bufferfrom == -1) {
				vars.bufferfrom = cfrom;
				vars.bufferto = cto;
				vars.buffertext = "";
				self.editorController.save();
				return;
			} else if (vars.bufferto != -1 && chg.origin == "+delete" &&
				cto == vars.bufferfrom) {
				vars.bufferfrom = cfrom;
				self.editorController.save();
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
		$('#editor').hide();
		$('#filecontrol').show();
		$('#footer').show();

		self.globalModel.socket.emit('leave', {});

		var localThis = self;

		self.globalModel.refreshfilelist(function() {;
		}, function() {

			var localLocalThis = localThis;

			$("body").animate({
				scrollTop: localLocalThis.roomModel.vars.oldscrolltop
			});
		});

		self.socketController.leaveVoiceRoom();
	},

	//点击运行时的界面控制
	setrun: function() {
		self.roomModel.vars.runLock = true;
		$('#editor-run').html('<i class="icon-stop"></i>');
		$('#editor-run').attr('title', self.globalModel.strings['kill-title']);
		$('#console-inner').html('');
		$('#console-input').val('');
		$('#editor-debug').addClass('disabled');
		$('#console-title').text(self.globalModel.strings['console']);
		this.openconsole();
	},

	//调试一个程序时的界面控制
	setdebug: function() {
		self.roomModel.vars.debugLock = true;
		$('#editor-debug').html('<i class="icon-eye-close"></i>');
		$('#editor-debug').attr('title', strings['stop-debug-title']);
		$('#console-inner').html('');
		$('#console-input').val('');
		$('#editor-run').addClass('disabled');
		$('#console-title').text(self.globalModel.strings['console']);
		this.openconsole();
	},

	//进入编辑界面时，显示各种数据
	//data : {id, users(hongyu:true, hongdashen:true), version, text, bps, exprs(监视列表的表达式{变量：值})}	
	socket_on_set: function(socket) {

		var localThis = this;

		socket.on('set', function(data) {

			var vars = self.roomModel.vars;

			vars.savetimestamp = 1;
			self.editorController.setsavedthen(1);

			vars.q.length = 0;
			vars.bq.length = 0;
			vars.lock = false;

			$('#editor-run').html('<i class="icon-play"></i>');
			$('#editor-run').attr('title', self.globalModel.strings['run-title']);
			vars.runLock = false;
			vars.debugLock = false;
			vars.waiting = false;

			$('#current-doc').html(htmlescape(vars.docobj.showname));
			$('#chat-input').val('');
			$('#chat-show-inner').text('');
			$('#editor').show();
			$('#filecontrol').hide();
			$('#footer').hide();
			var filepart = vars.docobj.name.split('.');
			vars.ext = filepart[filepart.length - 1];
			self.globalModel.changelanguage(vars.ext);
			self.run_debugController.checkrunanddebug(vars.ext);

			self.globalModel.editor.refresh();

			if (self.globalModel.currentDir.length == 1) {
				self.globalModel.memberlistdoc.fromdoc(vars.docobj);
			}
			self.globalModel.memberlistdoc.setalloffline();
			self.globalModel.memberlistdoc.setonline(self.globalModel.currentUser.name, true);

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

			self.globalModel.operationLock = false;

			vars.lock = true;
			vars.doc = data;
			self.globalModel.editor.setValue(vars.doc.text);
			self.globalModel.editor.clearHistory();
			self.globalModel.editor.setOption('readOnly', false);
			self.run_debugController.initbreakpoints(data.bps);
			for (var i in data.users) {
				self.globalModel.memberlistdoc.setonline(i, true);
				if (i == self.globalModel.currentUser.name)
					continue;
				var cursor = localThis.newcursor(i);
				if (vars.cursors[i] && vars.cursors[i].element)
					$(vars.cursors[i].element).remove();
				vars.cursors[i] = {
					element: cursor,
					pos: 0
				};
			}
			self.globalModel.memberlistdoc.sort();

			self.globalModel.filelist.removeloading();
			$('#console-inner').html('');
			localThis.closeconsole();
			self.globalModel.expressionlist.clear();
			for (var k in data.exprs) {
				self.globalModelexpressionlist.addExpression(k);
				self.globalModelexpressionlist.setValue(k, data.exprs[k]);
			}

			$('#console-title').text(self.globalModel.strings['console']);

			localThis.resize();
			$('body').scrollTop(99999);

			if (data.running) {
				self.run_debugController.setrun();
			}
			if (data.debugging) {
				self.run_debugController.setdebug();
				self.globalModel.editor.setOption('readOnly', true);
				vars.old_text = data.text;
				vars.old_bps = data.bps;
				if (data.state == 'waiting') {
					vars.waiting = true;
					self.run_debugController.runtoline(data.line - 1);
					$('.debugandwait').removeClass('disabled');
					if (data.line !== null)
						$('#console-title').text(self.globalModel.strings['console'] + self.globalModel.strings['waiting']);
					else
						$('#console-title').text(self.globalModel.strings['console'] + self.globalModel.strings['waiting'] + self.globalModel.strings['nosource']);
				}
			}
			localThis.setrunanddebugstate();

			delete data.running;
			delete data.debugging;
			delete data.state;
		});
	}
	
});

/********************SilunWang*****************/
/*
var CursorController = can.Control.extend({

	//当前页面的模型
	roomModel: undefined,
	//全局模型
	globalModel: undefined,
	//解决init函数this指针问题
	self: this,

	init: function(element, option) {
		var cursor = can.view("../ejs/cursor.ejs", {});
		cursor.find('.cursor-inner').popover({
			html: true,
			content: '<b>' + content + '</b>',
			placement: 'bottom',
			trigger: 'hover'
		});
		this.element.append(cursor);
		return cursor;
	}
});
*/
