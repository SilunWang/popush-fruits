var RunCodeConstruct = can.Construct.extend({}, {

	//当前页面的模型
	roomModel: undefined,
	//全局模型
	globalModel: undefined,
	//当前页面的主控制器
	roomConstruct: undefined,

	init: function(options) {

		this.roomModel = options.roomModel;
		this.globalModel = options.globalModel;
		this.roomConstruct = options.roomConstruct;

		//初始化socket
		var socket = this.globalModel.socket;
		this.socket_on_add_expr(socket);
		this.socket_on_rm_expr(socket);
		this.socket_on_run(socket);
		this.socket_on_debug(socket);
		this.socket_on_running(socket);
		this.socket_on_waiting(socket);
		this.socket_on_stdout(socket);
		this.socket_on_stdin(socket);
		this.socket_on_stderr(socket);
		this.socket_on_exit(socket);
		this.socket_on_bpsok(socket);
		this.socket_on_bps(socket);
		
		//初始化expressionList
		var expressionlist = this.globalModel.expressionlist;
		expressionlist.renameExpression = this.expressionlist_renameExpression;
		expressionlist.renameExpressionDone = this.expressionlist_renameExpressionDone;
		expressionlist.removeExpression = this.expressionlist_removeExpression;
	},
	
	//根据扩展名（ext）设置代码编辑器左边边栏的点击事件
	//如果代码可以被调试，则点击左边栏会增加/删除断点
	//该函数在每次进入代码编辑器时调用
	checkrunanddebug: function(ext) {
		//解决this指针问题
		var localThis = this;
		//模型变量的引用
		var vars = this.roomModel.vars;

		if (ENABLE_RUN) {
			vars.runable = this.roomModel.isrunable(ext);
		}
		if (ENABLE_DEBUG) {
			vars.debugable = this.roomModel.isdebugable(ext);
			if (vars.debugable) {
				this.globalModel.gutterclick = function(cm, n) {
					if (vars.debugLock && !vars.waiting)
						return;
					//如果断点删除失败（本身不存在），则增加断点，否则删除断点
					if (!localThis.removebreakpointat(cm, n)) {
						localThis.addbreakpointat(cm, n);
					}
				};
			} else {
				this.globalModel.gutterclick = function(cm, n) {};
			}
			this.removeallbreakpoints();
		}
		this.roomConstruct.setrunanddebugstate();
	},

	//向服务器发送设置的断点信息
	//from:断点之前一行
	//to:断点所在的一行
	//text:增加断点=1,取消断点=0
	sendbreak: function(from, to, text) {
		var req = {
			version: this.roomModel.vars.doc.version,
			from: from,
			to: to,
			text: text
		};
		if (this.roomModel.vars.bq.length == 0) {
			socket.emit('bps', req);
		}
		this.roomModel.vars.bq.push(req);
	},

	//增加一个断点
	//cm:一个codeMirror对象
	//n:断点上一行行号
	addbreakpointat: function(cm, n) {
		var vars = this.roomModel.vars;
		var addlen = n - vars.bps.length;
		//在一个人编辑的情况下，addlen始终为负数
		if (addlen > 0) {
			var addtext = "";
			for (var i = vars.bps.length; i < n - 1; i++) {
				addtext += "0";
			}
			addtext += "1";
			//bps += addtext;
			this.sendbreak(vars.bps.length, vars.bps.length, addtext);
		} else {
			//bps = bps.substr(0, n) + "1" + bps.substr(n+1);
			this.sendbreak(n, n + 1, "1");
		}

		var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
		cm.setGutterMarker(n, 'breakpoints', element);
	},

	//删除一个断点，在增加断点时也会被调用
	//cm:一个codeMirror对象
	//n:断点上一行行号
	//返回值：删除成功则返回1，断点不存在则返回0
	removebreakpointat: function(cm, n) {
		var info = cm.lineInfo(n);
		if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
			cm.setGutterMarker(n, 'breakpoints', null);
			//bps = bps.substr(0, n) + "0" + bps.substr(n+1);
			this.sendbreak(n, n + 1, "0");
			return true;
		}
		return false;
	},

	//检查这一行是否有断点
	havebreakat: function(cm, n) {
		var info = cm.lineInfo(n);
		if (info && info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
			return "1";
		}
		return "0";
	},

	//调试的时候，在界面标注当前进行在第几行，n：行数
	runtoline: function(n) {
		var vars = this.roomModel.vars;
		if (vars.runningline >= 0) {
			this.roomModel.vars.editor.removeLineClass(runningline, '*', 'running');
			this.roomModel.vars.editor.setGutterMarker(runningline, 'runat', null);
		}
		if (n >= 0) {
			this.roomModel.vars.editor.addLineClass(n, '*', 'running');
			this.roomModel.vars.editor.setGutterMarker(n, 'runat', $('<div><img src="images/arrow.png" width="16" height="16" style="min-width:16px;min-width:16px;" /></div>').get(0));
			this.roomModel.vars.editor.scrollIntoView({
				line: n,
				ch: 0
			});
		}
		vars.runningline = n;
	},

	//根据断点的信息初始化网页断点,bpsstr:传入的断点信息
	initbreakpoints: function(bpsstr) {
		var vars = this.roomModel.vars;
		vars.bps = bpsstr;
		for (var i = bpsstr.length; i < this.roomModel.vars.editor.lineCount(); i++) {
			vars.bps += "0";
		}
		for (var i = 0; i < vars.bps.length; i++) {
			if (vars.bps[i] == "1") {
				var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
				this.roomModel.vars.editor.setGutterMarker(i, 'breakpoints', element);
			}
		}
	},

	//要运行一个程序时调用，向服务器传送相应数据
	run: function() {
		var vars = this.roomModel.vars;
		if (!this.roomModel.runenabled())
			return;
		if (this.globalModel.operationLock)
			return;
		this.globalModel.operationLock = true;
		//runLock：如果正在运行，则为true
		if (vars.runLock) {
			this.globalModel.socket.emit('kill');
		} else {
			this.globalModel.socket.emit('run', {
				version: vars.doc.version,
				type: vars.ext
			});
		}
	},


	//要调试一个程序时调用，向服务器传送相应数据
	debug: function() {
		var vars = this.roomModel.vars;
		if (!this.roomModel.debugenabled())
			return;
		if (this.globalModel.operationLock)
			return;
		this.globalModel.operationLock = true;
		if (vars.debugLock) {
			this.globalModel.socket.emit('kill');
		} else {
			this.globalModel.socket.emit('debug', {
				version: vars.doc.version,
				type: vars.ext
			});
		}
	},

	//调试-逐语句
	debugstep: function() {
		var vars = this.roomModel.vars;
		if (vars.debugLock && vars.waiting) {
			this.globalModel.socket.emit('step', {});
		}
	},

	//调试-逐过程
	debugnext: function() {
		var vars = this.roomModel.vars;
		if (vars.debugLock && vars.waiting) {
			this.globalModel.socket.emit('next', {});
		}
	},

	//调试-跳出过程
	debugfinish: function() {
		var vars = this.roomModel.vars;
		if (vars.debugLock && vars.waiting) {
			this.globalModel.socket.emit('finish', {});
		}
	},

	//调试-继续
	debugcontinue: function() {
		var vars = this.roomModel.vars;
		if (vars.debugLock && vars.waiting) {
			this.globalModel.socket.emit('resume', {});
		}
	},

	//根据断点的信息初始化网页断点,bpsstr:传入的断点信息
	initbreakpoints: function(bpsstr) {
		var vars = this.roomModel.vars;
		vars.bps = bpsstr;
		for (var i = bpsstr.length; i < this.roomModel.vars.editor.lineCount(); i++) {
			vars.bps += "0";
		}
		for (var i = 0; i < vars.bps.length; i++) {
			if (vars.bps[i] == "1") {
				var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
				this.roomModel.vars.editor.setGutterMarker(i, 'breakpoints', element);
			}
		}
	},

	//删除所有断点
	removeallbreakpoints: function() {
		var vars = this.roomModel.vars;
		for (var i = 0; i < vars.bps.length; i++) {
			if (vars.bps[i] == "1") {
				var info = this.roomModel.vars.editor.lineInfo(i);
				if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
					this.roomModel.vars.editor.setGutterMarker(i, 'breakpoints', null);
				}
			}
		}
		vars.bps.replace("1", "0");
	},

	//处理控制台的输入
	stdin: function() {
		var vars = this.roomModel.vars;
		if (vars.debugLock && vars.waiting)
			return;
		var text = $('#console-input').val();
		//当处于运行等待状态时，发送输入框数据到服务器
		if (vars.runLock || vars.debugLock) {
			globalModel.socket.emit('stdin', {
				data: text + '\n'
			});
			//在发送之后，也在控制台输出了内容，应当是别的函数调用了appendtoconsole
		} else {
			roomConstruct.appendtoconsole(text + '\n', 'stdin');
		}
		$('#console-input').val('');
	},

	//接收服务器发送过来的添加监视的信息
	socket_on_add_expr: function(socket) {
		var localThis = self;
		socket.on('add-expr', function(data) {
			if (data.expr) {
				localThis.globalModel.expressionlist.addExpression(data.expr);
				localThis.globalModel.expressionlist.setValue(data.expr, data.val);
			}
		});
	},

	//接收服务器发送过来的移除监视的信息，data:监视的变量名-变量值
	socket_on_rm_expr: function(socket) {
		var localThis = this;
		socket.on('rm-expr', function(data) {
			localThis.globalModel.expressionlist.removeElementByExpression(data.expr);
		});
	},

	//接收到服务器发送的运行消息
	//data : {(uesr)name, time};
	socket_on_run: function(socket) {
		var localRoom = this.roomConstruct;
		var localThis = this;
		socket.on('run', function(data) {
			localRoom.appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;&nbsp;' + strings['runsaprogram'], new Date(data.time));
			localRoom.setrun();
			localThis.globalModel.operationLock = false;
		});
	},


	//接收到服务器发送的运行消息
	//data : {(uesr)name, time, text（程序）, bps(断点信息字符串)};
	socket_on_debug: function(socket) {
		var localThis = this;
		var localRoom = this.roomConstruct;
		var strings = this.globalModel.strings;
		socket.on('debug', function(data) {
			localRoom.appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;&nbsp;' + strings['startdebug'], new Date(data.time));

			localRoom.setdebug();

			localThis.roomModel.vars.editor.setOption('readOnly', true);
			localThis.roomModel.vars.old_text = localThis.roomModel.vars.editor.getValue();
			localThis.roomModel.vars.old_bps = localThis.roomModel.vars.bps;
			localThis.roomModel.vars.editor.setValue(data.text);
			localThis.removeallbreakpoints();
			localThis.initbreakpoints(data.bps);

			var editordoc = localThis.roomModel.vars.editor.getDoc();
			var hist = editordoc.getHistory();
			hist.done.pop();
			editordoc.setHistory(hist);

			localThis.globalModel.operationLock = false;
		});
	},

	//处理服务器发送的“正在运行”消息
	//?data : 一直是null?
	socket_on_running: function(socket) {

		var vars = this.roomModel.vars;
		var localThis = this;

		socket.on('running', function(data) {
			if (!vars.debugLock)
				return;
			vars.waiting = false;
			localThis.runtoline(-1);
			$('.debugandwait').addClass('disabled');
			$('#console-title').text(strings['console']);
		});
	},

	//"等待"消息的处理函数
	//在debug条件下出现
	//data : {line, exprs}
	socket_on_waiting: function(socket) {

		var vars = this.roomModel.vars;
		var localThis = self;
		var strings = this.globalModel.strings;

		socket.on('waiting', function(data) {
			if (!vars.debugLock)
				return;
			vars.waiting = true;
			if (typeof data.line === 'number') {
				localThis.runtoline(data.line - 1);
			} else {
				localThis.runtoline(-1);
			}
			//依次设定表达式的值
			for (var k in data.exprs) {
				localThis.roomModel.expressionlist.setValue(k, data.exprs[k]);
			}
			$('.debugandwait').removeClass('disabled');
			if (typeof data.line === 'number')
				$('#console-title').text(strings['console'] + strings['waiting']);
			else if (data.line !== null)
				$('#console-title').text(strings['console'] + strings['waiting'] + '[' + data.line + ']');
			else
				$('#console-title').text(strings['console'] + strings['waiting'] + strings['nosource']);
		});
	},

	//处理输出
	socket_on_stdout: function(socket) {
		var localRoom = this.roomConstruct;
		socket.on('stdout', function(data) {
			localRoom.appendtoconsole(data.data);
		});
	},

	//处理输入
	socket_on_stdin: function(socket) {
		var localRoom = this.roomConstruct;
		socket.on('stdin', function(data) {
			localRoom.appendtoconsole(data.data, 'stdin');
		});
	},

	//处理错误流
	socket_on_stderr: function(socket) {
		var localRoom = this.roomConstruct;
		socket.on('stderr', function(data) {
			localRoom.appendtoconsole(data.data, 'stderr');
		});
	},


	//处理程序退出
	socket_on_exit: function(socket) {

		var localThis = this;
		var localRoom = this.roomConstruct;
		var vars = this.roomModel.vars;
		var strings = this.globalModel.strings;

		socket.on('exit', function(data) {

			localThis.globalModel.operationLock = false;

			if (data.err.code !== undefined)
				localRoom.appendtochatbox(strings['systemmessage'], 'system', strings['programfinish'] + '&nbsp;' + data.err.code, new Date(data.time));
			else
				localRoom.appendtochatbox(strings['systemmessage'], 'system', strings['programkilledby'] + '&nbsp;' + data.err.signal, new Date(data.time));

			//运行时退出
			if (vars.runLock) {
				$('#editor-run').html('<i class="icon-play"></i>');
				$('#editor-run').attr('title', strings['run-title']);
				vars.runLock = false;
			}
			//调试时退出
			if (vars.debugLock) {
				localThis.roomModel.vars.editor.setValue(vars.old_text);
				localThis.removeallbreakpoints();
				localThis.initbreakpoints(vars.old_bps);

				var editordoc = localThis.roomModel.vars.editor.getDoc();
				var hist = editordoc.getHistory();
				hist.done.pop();
				editordoc.setHistory(hist);

				localThis.roomModel.vars.editor.setOption('readOnly', false);
				if (vars.q.length > 0) {
					localThis.globalModel.socket.emit('change', vars.q[0]);
				}
				$('#editor-debug').html('<i class="icon-eye-open"></i>');
				$('#editor-debug').attr('title', strings['debug-title']);
				localThis.runtoline(-1);
				for (var k in localThis.globalModel.expressionlist.elements) {
					localThis.globalModel.expressionlist.setValue(localThis.expressionlist.elements[k].expression, null);
				}
				vars.debugLock = false;
			}
			localRoom.setrunanddebugstate();
			$('#console-title').text(strings['console'] + strings['finished']);
		});
	},


	//设置一个断点时的响应函数 breakpoints_ok
	//?data : undefined , 貌似没用
	//本函数在自己设置断点时被调用
	socket_on_bpsok: function(socket) {

		var vars = this.roomModel.vars;
		var localRoom = this.roomConstruct;

		socket.on('bpsok', function(data) {
			var chg = vars.bq.shift();
			//chg例子 : Object {version: 2, from: 7, to: 8, text: "1"} 
			//text == 1 表示增加断点, text == 0 表示删除断点
			if (!chg)
				return;
			vars.bps = vars.bps.substr(0, chg.from) + chg.text + vars.bps.substr(chg.to);
			if (vars.debugLock)
				vars.old_bps = vars.old_bps.substr(0, chg.from) + chg.text + vars.old_bps.substr(chg.to);
			vars.doc.version++;
			vars.doc.version = vars.doc.version % 65536;
			for (var i = 0; i < vars.q.length; i++) {
				vars.q[i].version++;
				vars.q[i].version = vars.q[i].version % 65536;
			}
			for (var i = 0; i < vars.bq.length; i++) {
				vars.bq[i].version++;
				vars.bq[i].version = vars.bq[i].version % 65536;
			}
			if (vars.q.length > 0) {
				this.globalModel.socket.emit('change', vars.q[0]);
			}
			if (vars.bq.length > 0) {
				this.globalModel.socket.emit('bps', vars.bq[0]);
			}
		});
	},

	//设置一个断点时的响应函数 breakpoints
	//data例子 : Object {version: 5, from: 7, to: 8, text: "1", name: "hongshaoyu2008"}
	//本函数在他人设置断点时被调用
	socket_on_bps: function(socket) {

		var vars = this.roomModel.vars;
		var localThis = self;


		socket.on('bps', function(data) {
			var tfrom = data.from;
			var tto = data.to;
			var ttext = data.text;
			for (var i = 0; i < vars.bq.length; i++) {
				if (vars.bq[i].to <= tfrom) {
					tfrom += vars.bq[i].text.length + vars.bq[i].from - vars.bq[i].to;
					tto += vars.bq[i].text.length + vars.bq[i].from - vars.bq[i].to;
				} else if (vars.bq[i].to <= tto && vars.bq[i].from <= tfrom) {
					var tdlen = tto - vars.bq[i].to;
					vars.bq[i].to = tfrom;
					tfrom = vars.bq[i].from + vars.bq[i].text.length;
					tto = tfrom + tdlen;
				} else if (vars.bq[i].to <= tto && vars.bq[i].from > tfrom) {
					tto = tto + vars.bq[i].text.length + vars.bq[i].from - vars.bq[i].to;
					ttext = vars.bq[i].text + ttext;
					vars.bq[i].from = tfrom;
					vars.bq[i].to = tfrom;
				} else if (vars.bq[i].to > tto && vars.bq[i].from <= tfrom) {
					var bqlen = vars.bq[i].text.length;
					//q[i].to = q[i].to + ttext.length + tfrom - tto;
					vars.bq[i].to = vars.bq[i].to + ttext.length + tfrom - tto;
					vars.bq[i].text = vars.bq[i].text + ttext;
					tfrom = vars.bq[i].from + bqlen;
					tto = tfrom;
				} else if (vars.bq[i].to > tto && vars.bq[i].from <= tto) {
					var bqdlen = vars.bq[i].to - tto;
					tto = vars.bq[i].from;
					vars.bq[i].from = tfrom + ttext.length;
					vars.bq[i].to = vars.bq[i].from + bqdlen;
				} else if (vars.bq[i].from > tto) {
					vars.bq[i].from += ttext.length + tfrom - tto;
					vars.bq[i].to += ttext.length + tfrom - tto;
				}
				vars.bq[i].version++;
				vars.bq[i].version = vars.bq[i].version % 65536;
			}
			for (var i = 0; i < vars.q.length; i++) {
				vars.q[i].version++;
				vars.q[i].version = vars.q[i].version % 65536;
			}
			bps = bps.substr(0, data.from) + data.text + bps.substr(data.to);
			if (vars.debugLock)
				vars.old_bps = vars.old_bps.substr(0, data.from) + data.text + vars.old_bps.substr(data.to);
			if (data.to == data.from + 1) {
				if (data.text == "1") {
					var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
					this.roomModel.vars.editor.setGutterMarker(data.from, 'breakpoints', element);
				} else if (data.text == "0") {
					var info = this.roomModel.vars.editor.lineInfo(data.from);
					if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
						this.roomModel.vars.editor.setGutterMarker(data.from, 'breakpoints', null);
					}
				}
			}
			vars.doc.version++
			vars.doc.version = vars.doc.version % 65536;
			if (vars.bq.length > 0) {
				this.globalModel.socket.emit('bps', vars.bq[0]);
			}
		});
	},

	expressionlist_renameExpression: function(id) {

		var vars = this.roomModel.vars;

		this.globalModel.expressionlist.r.doneall();
		if (vars.debugLock && !vars.waiting)
			return;
		var input = this.globalModel.expressionlist.elements[id].elem.find('input');
		var span = this.globalModel.expressionlist.elements[id].elem.find('.title');
		var expression = span.text();
		span.hide();
		input.val($.trim(expression));
		input.show();
		input.focus();
		input.select();
		this.globalModel.expressionlist.r.seteditingelem(id);
	},

	//修改监视列表完成时的处理工作，在按下回车或者点击空白时发生
	expressionlist_renameExpressionDone: function(id) {

		var expThis = this.globalModel.expressionlist;
		var vars = this.roomModel.vars;

		var input = expThis.elements[id].elem.find('input');
		var span = expThis.elements[id].elem.find('span');
		var expression = $.trim(input.val());

		if (vars.debugLock && !vars.waiting) {
			if (!expThis.elements[id].notnew) {
				expThis.elements[id].elem.remove();
				delete expThis.elements[id];
			} else {
				input.hide();
				span.show();
			}
		} else {
			if (expThis.elements[id].notnew) {
				this.globalModel.socket.emit('rm-expr', {
					expr: expThis.elements[id].expression
				});
			}

			if (expression != '') {
				this.globalModel.socket.emit('add-expr', {
					expr: expression
				});
			}

			expThis.elements[id].elem.remove();
			delete expThis.elements[id];
		}
		expThis.r.seteditingelem(null);
	},

	//删除监视的变量
	expressionlist_removeExpression: function(id) {
		var expThis = this.globalModel.expressionlist;
		expThis.r.doneall();
		this.globalModel.socket.emit('rm-expr', {
			expr: expThis.elements[id].expression
		});
	}
});
