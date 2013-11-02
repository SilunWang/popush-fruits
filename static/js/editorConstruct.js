//////////////////////// Socket Controller //////////////////////////////

/************************************************************************
|    函数名称： EditorController                                                
|    函数功能： 包装了与代码编辑和socket.on相关函数                                            
|    引用： globalModel roomModel roomConstruct     
|	 Author: SilunWang             
*************************************************************************/

var EditorConstruct = can.Construct.extend({}, {

	//全局变量
	globalModel: undefined,
	//room Model
	roomModel: undefined,
	//room Construct
	roomConstruct: undefined,

	init: function(options){
		//init
		this.globalModel = options.globalModel;
		this.roomModel = options.roomModel;
		this.roomConstruct = options.roomConstruct;
		this.InitEditor();
		//socket on
		this.socket_on_ok(this.globalModel.socket);
		this.socket_on_change(this.globalModel.socket);
	},

	//标记已经保存
	setsave: function() {
		this.roomModel.vars.savetimestamp = new Date().getTime();
		setTimeout(this.setsavedthen(this.roomModel.vars.savetimestamp), this.roomModel.vars.savetimeout);
		this.roomModel.vars.savetimeout = 5000;
	},

	setsaved: function(){
        this.roomModel.vars.savetimestamp = new Date().getTime();
        setTimeout(this.setsavedthen(this.roomModel.vars.savetimestamp), this.roomModel.vars.savetimeout);
        this.roomModel.vars.savetimeout = 5000;
	},

	//在页面上标记已经保存
	setsavedthen: function(timestamp) {
		if (this.roomModel.vars.savetimestamp == timestamp) {
			$('#current-doc-state').removeClass('red');
			$('#current-doc-state').text(this.globalModel.strings['saved']);
			$('#editor-back').popover('destroy');
			$('#editor-back').attr('title', this.globalModel.strings['back']);
			this.roomModel.vars.issaving = false;
			this.roomConstruct.setrunanddebugstate();
		}
	},

	//在页面上标记正在保存
	setsaving: function() {
		var vars = this.roomModel.vars;
		$('#current-doc-state').addClass('red');
		$('#current-doc-state').text(this.globalModel.strings['saving...']);
		$('#editor-back').attr('title', '');
		$('#editor-back').popover({
			html: true,
			content: this.globalModel.strings['unsaved'],
			placement: 'right',
			trigger: 'hover',
			container: 'body'
		});
		vars.savetimestamp = 0;
		vars.savetimestamp = true;
		this.roomConstruct.setrunanddebugstate();
	},

	//将自己修改的一段文字发送给服务器
	//buffertimeout = 1000
	//this.roomModel.buffertext : 输入的内容，删除为”“
	//bufferfrom != -1 && this.roomModel.bufferto != -1 -- 用backspace删除
	//bufferfrom != -1 && this.roomModel.bufferto == -1 -- 普通的输入
	//bufferfrom == -1 && this.roomModel.bufferto == -1 -- 选中一段文字删除
	//选中一段文字修改 : 输入多个字母的话，同普通的输入
	sendbuffer: function() {

		var vars = this.roomModel.vars;

		if (vars.bufferfrom != -1) {
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
			vars.buffertimeout = SAVE_TIME_OUT;
		}
	},

	//设置保存
	//没找到什么时候调用
	save: function() {
		var vars = this.roomModel.vars;
		this.setsaving();
		if (vars.timer != null) {
			clearTimeout(vars.timer);
		}
		vars.timer = setTimeout(this.sendbuffer(), vars.buffertimeout);
	},

	winHeight: function() {
		return window.innerHeight || (document.documentElement || document.body).clientHeight;
	},

	setFullScreen: function(cm, full) {
		var wrap = cm.getWrapperElement();
		if (full) {
			$('#editormain').css('position', 'static');
			$('#editormain-inner').css('position', 'static');
			$('#fullscreentip').fadeIn();
			setTimeout('$(\'#fullscreentip\').fadeOut();', 1000);
			wrap.className += " CodeMirror-fullscreen";
			wrap.style.height = this.winHeight() + "px";
			document.documentElement.style.overflow = "hidden";
		} else {
			$('#editormain').css('position', 'fixed');
			$('#editormain-inner').css('position', 'relative');
			$('#fullscreentip').hide();
			wrap.className = wrap.className.replace(" CodeMirror-fullscreen", "");
			wrap.style.height = "";
			document.documentElement.style.overflow = "";
		}
		cm.refresh();
		cm.focus();
	},

	InitEditor: function() {

		var localThis = this;

		CodeMirror.on(window, "resize", function() {
			var showing = document.getElementsByClassName("CodeMirror-fullscreen")[0];
			if (!showing) return;
			showing.CodeMirror.getWrapperElement().style.height = localThis.winHeight() + "px";
		});

		this.roomModel.vars.editor = CodeMirror.fromTextArea($('#editor-textarea').get(0), {
			lineNumbers: true,
			lineWrapping: true,
			indentUnit: 4,
			indentWithTabs: true,
			extraKeys: {
				"Esc": function(cm) {
					if (localThis.roomConstruct.isFullScreen(cm)) localThis.setFullScreen(cm, false);
					localThis.roomConstruct.resize();
				},
				"Ctrl-S": function(cm) {
					var vars = localThis.roomModel.vars;
					if (vars.savetimestamp != 0)
						localThis.setsavedthen(vars.savetimestamp);
					vars.savetimestamp = 0;
				}
			},
			gutters: ["rfunat", "CodeMirror-linenumbers", "breakpoints"]
		});

		this.roomModel.vars.editor.on("gutterClick", function(cm, n) {
			localThis.roomConstruct.gutterclick(cm, n);
		});

		this.roomConstruct.gutterclick = function(cm, n) {};
	},

	
	//当对代码的修改已保存时对应的响应函数，用于版本控制
	//?data : undefined , 貌似没用
	socket_on_ok: function(socket) {

		var vars = this.roomModel.vars;

		socket.on('ok', function(data) {
			var chg = vars.q.shift();
			if (!chg)
				return;
			vars.doc.text = vars.doc.text.substr(0, chg.from) + chg.text + vars.doc.text.substr(chg.to);
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
				socket.emit('change', vars.q[0]);
			}
			if (vars.bq.length > 0) {
				socket.emit('bps', vars.bq[0]);
			}
		});
	},

	//协同编辑算法
	//object : {version: 57, from: 150, to: 150, text: "fdfd", name: "hongshaoyu2008"}
	//别人更改代码时才会调用
	socket_on_change: function(socket){

		var localThis = this;
		var vars = this.roomModel.vars
		
		socket.on('change', function(data) {

			vars.lock = true;
			var tfrom = data.from;
			var tto = data.to;
			var ttext = data.text;

			for (var i = 0; i < vars.q.length; i++) {
				if (vars.q[i].to <= tfrom) {
					tfrom += vars.q[i].text.length + vars.q[i].from - vars.q[i].to;
					tto += vars.q[i].text.length + vars.q[i].from - vars.q[i].to;
				} else if (vars.q[i].to <= tto && vars.q[i].from <= tfrom) {
					var tdlen = tto - vars.q[i].to;
					vars.q[i].to = tfrom;
					tfrom = vars.q[i].from + vars.q[i].text.length;
					tto = tfrom + tdlen;
				} else if (vars.q[i].to <= tto && vars.q[i].from > tfrom) {
					tto = tto + vars.q[i].text.length + vars.q[i].from - vars.q[i].to;
					ttext = vars.q[i].text + ttext;
					vars.q[i].from = tfrom;
					vars.q[i].to = tfrom;
				} else if (vars.q[i].to > tto && vars.q[i].from <= tfrom) {
					var qlen = vars.q[i].text.length;
					vars.q[i].to = vars.q[i].to + ttext.length + tfrom - tto;
					vars.q[i].text = vars.q[i].text + ttext;
					tfrom = vars.q[i].from + qlen;
					tto = tfrom;
				} else if (vars.q[i].to > tto && vars.q[i].from <= tto) {
					var qdlen = vars.q[i].to - tto;
					tto = vars.q[i].from;
					vars.q[i].from = tfrom + ttext.length;
					vars.q[i].to = vars.q[i].from + qdlen;
				} else if (vars.q[i].from > tto) {
					vars.q[i].from += ttext.length + tfrom - tto;
					vars.q[i].to += ttext.length + tfrom - tto;
				}
				vars.q[i].version++;
				vars.q[i].version = vars.q[i].version % 65536;
			}

			for (var i = 0; i < vars.bq.length; i++) {
				vars.bq[i].version++;
				vars.bq[i].version = vars.bq[i].version % 65536;
			}

			if (vars.bufferfrom != -1) {
				if (vars.bufferto == -1) {
					if (vars.bufferfrom <= tfrom) {
						tfrom += vars.buffertext.length;
						tto += vars.buffertext.length;
					} else if (vars.bufferfrom <= tto) {
						tto += vars.buffertext.length;
						ttext = vars.buffertext + ttext;
						vars.bufferfrom = tfrom;
					} else {
						vars.bufferfrom += ttext.length + tfrom - tto;
					}
				} else {
					if (vars.bufferto <= tfrom) {
						tfrom += vars.bufferfrom - vars.bufferto;
						tto += vars.bufferfrom - vars.bufferto;
					} else if (vars.bufferto <= tto && vars.bufferfrom <= tfrom) {
						var tdlen = tto - vars.bufferto;
						vars.bufferto = tfrom;
						tfrom = vars.bufferfrom;
						tto = tfrom + tdlen;
					} else if (vars.bufferto <= tto && vars.bufferfrom > tfrom) {
						tto = tto + vars.bufferfrom - vars.bufferto;
						vars.bufferfrom = -1;
						vars.bufferto = -1;
					} else if (vars.bufferto > tto && vars.bufferfrom <= tfrom) {
						vars.bufferto = vars.bufferto + ttext.length + tfrom - tto;
						vars.buffertext = vars.buffertext + ttext;
						tfrom = vars.bufferfrom;
						tto = tfrom;
					} else if (vars.bufferto > tto && vars.bufferfrom <= tto) {
						var qdlen = vars.bufferto - tto;
						tto = vars.bufferfrom;
						vars.bufferfrom = tfrom + ttext.length;
						vars.bufferto = vars.bufferfrom + qdlen;
					} else if (vars.bufferfrom > tto) {
						vars.bufferfrom += ttext.length + tfrom - tto;
						vars.bufferto += ttext.length + tfrom - tto;
					}
				}
			}

			var delta = tfrom + ttext.length - tto;
			var editorDoc = vars.editor.getDoc();
			var hist = editorDoc.getHistory();
			var donefrom = new Array(hist.done.length);
			var doneto = new Array(hist.done.length);
			for (var i = 0; i < hist.done.length; i++) {
				donefrom[i] = vars.editor.indexFromPos(hist.done[i].changes[0].from);
				doneto[i] = vars.editor.indexFromPos(hist.done[i].changes[0].to);
			}
			var undonefrom = new Array(hist.undone.length);
			var undoneto = new Array(hist.undone.length);
			for (var i = 0; i < hist.undone.length; i++) {
				undonefrom[i] = editorDoc.indexFromPos(hist.undone[i].changes[0].from);
				undoneto[i] = editorDoc.indexFromPos(hist.undone[i].changes[0].to);
			}
			for (var i = 0; i < hist.done.length; i++) {
				if (doneto[i] <= tfrom) {} else if (doneto[i] <= tto && donefrom[i] <= tfrom) {
					hist.done[i].changes[0].to = vars.editor.posFromIndex(tfrom);
				} else if (doneto[i] <= tto && donefrom[i] > tfrom) {
					hist.done[i].changes[0].from = vars.editor.posFromIndex(tfrom);
					hist.done[i].changes[0].to = vars.editor.posFromIndex(tfrom);
				}
			}
			for (var i = 0; i < hist.undone.length; i++) {
				if (undoneto[i] <= tfrom) {} else if (undoneto[i] <= tto && undonefrom[i] <= tfrom) {
					hist.undone[i].changes[0].to = vars.editor.posFromIndex(tfrom);
				} else if (undoneto[i] <= tto && undonefrom[i] > tfrom) {
					hist.undone[i].changes[0].from = vars.editor.posFromIndex(tfrom);
					hist.undone[i].changes[0].to = vars.editor.posFromIndex(tfrom);
				}
			}
			vars.editor.replaceRange(ttext, vars.editor.posFromIndex(tfrom), vars.editor.posFromIndex(tto));
			for (var i = 0; i < hist.done.length; i++) {
				if (doneto[i] <= tfrom) {} else if (doneto[i] <= tto && donefrom[i] <= tfrom) {} else if (doneto[i] <= tto && donefrom[i] > tfrom) {} else if (doneto[i] > tto && donefrom[i] <= tfrom) {
					hist.done[i].changes[0].to = vars.editor.posFromIndex(doneto[i] + delta);
				} else if (doneto[i] > tto && donefrom[i] <= tto) {
					hist.done[i].changes[0].from = vars.editor.posFromIndex(tfrom + ttext.length);
					hist.done[i].changes[0].to = vars.editor.posFromIndex(donefrom[i] + doneto[i] - tto);
				} else if (donefrom[i] > tto) {
					hist.done[i].changes[0].from = vars.editor.posFromIndex(donefrom[i] + ttext.length + tfrom - tto);
					hist.done[i].changes[0].to = vars.editor.posFromIndex(doneto[i] + ttext.length + tfrom - tto);
				}
			}
			for (var i = 0; i < hist.undone.length; i++) {
				if (undoneto[i] <= tfrom) {} else if (undoneto[i] <= tto && undonefrom[i] <= tfrom) {} else if (undoneto[i] <= tto && undonefrom[i] > tfrom) {} else if (undoneto[i] > tto && undonefrom[i] <= tfrom) {
					hist.undone[i].changes[0].to = vars.editor.posFromIndex(undoneto[i] + delta);
				} else if (undoneto[i] > tto && undonefrom[i] <= tto) {
					hist.undone[i].changes[0].from = vars.editor.posFromIndex(tfrom + ttext.length);
					hist.undone[i].changes[0].to = vars.editor.posFromIndex(undonefrom[i] + undoneto[i] - tto);
				} else if (undonefrom[i] > tto) {
					hist.undone[i].changes[0].from = vars.editor.posFromIndex(undonefrom[i] + ttext.length + tfrom - tto);
					hist.undone[i].changes[0].to = vars.editor.posFromIndex(undoneto[i] + ttext.length + tfrom - tto);
				}
			}
			for (var i = 0; i < hist.done.length; i++) {
				hist.done[i].anchorAfter = hist.done[i].changes[0].from;
				hist.done[i].anchorBefore = hist.done[i].changes[0].from;
				hist.done[i].headAfter = hist.done[i].changes[0].from;
				hist.done[i].headBefore = hist.done[i].changes[0].from;
			}
			for (var i = 0; i < hist.undone.length; i++) {
				hist.undone[i].anchorAfter = hist.undone[i].changes[0].from;
				hist.undone[i].anchorBefore = hist.undone[i].changes[0].from;
				hist.undone[i].headAfter = hist.undone[i].changes[0].from;
				hist.undone[i].headBefore = hist.undone[i].changes[0].from;
			}
			editorDoc.setHistory(hist);
			vars.doc.text = vars.doc.text.substr(0, data.from) + data.text + vars.doc.text.substr(data.to);
			vars.doc.version++;
			vars.doc.version = vars.doc.version % 65536;
			if (vars.q.length > 0) {
				socket.emit('change', vars.q[0]);
			}

			var pos = vars.editor.posFromIndex(data.from + data.text.length);
			vars.cursors[data.name].pos = data.from + data.text.length;
			vars.editor.addWidget(pos, vars.cursors[data.name].element, false);
		});
	}

});
