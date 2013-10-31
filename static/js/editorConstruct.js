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
	setsaved: function() {
		this.roomModel.vars.savetimestamp = new Date().getTime();
		setTimeout('this.setsavedthen(' + this.roomModel.vars.savetimestamp + ')', this.roomModel.vars.savetimeout);
		this.roomModel.vars.savetimeout = 500;
	},

	//在页面上标记已经保存
	setsavedthen: function(timestamp) {

		if (this.roomModel.vars.savetimestamp == timestamp) {
			$('#current-doc-state').removeClass('red');
			$('#current-doc-state').text(strings['saved']);
			$('#editor-back').popover('destroy');
			$('#editor-back').attr('title', strings['back']);
			this.roomModel.vars.issaving = false;
			this.roomConstruct.setrunanddebugstate();
		}
	},

	//在页面上标记正在保存
	setsaving: function() {

		$('#current-doc-state').addClass('red');
		$('#current-doc-state').text(strings['saving...']);
		$('#editor-back').attr('title', '');
		$('#editor-back').popover({
			html: true,
			content: strings['unsaved'],
			placement: 'right',
			trigger: 'hover',
			container: 'body'
		});
		this.roomModel.vars.savetimestamp = 0;
		this.roomModel.vars.savetimestamp = true;
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

		if (this.roomModel.bufferfrom != -1) {
			if (this.roomModel.bufferto == -1) {
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
	//?没找到什么时候调用

	save: function() {
		this.setsaving();
		if (this.roomModel.timer != null) {
			clearTimeout(this.roomModel.timer);
		}
		this.roomModel.timer = setTimeout("this.sendbuffer", this.roomModel.buffertimeout);
	},

	//在按下ctrl+s之后调用的处理函数

	saveevent: function(cm) {
		if (this.roomModel.savetimestamp != 0)
			this.setsavedthen(this.roomModel.savetimestamp);
		this.roomModel.savetimestamp = 0;
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
			wrap.style.height = winHeight() + "px";
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
		CodeMirror.on(window, "resize", function() {
			var showing = document.getElementsByClassName("CodeMirror-fullscreen")[0];
			if (!showing) return;
			showing.CodeMirror.getWrapperElement().style.height = winHeight() + "px";
		});

		this.roomModel.vars.editor = CodeMirror.fromTextArea($('#editor-textarea').get(0), {
			lineNumbers: true,
			lineWrapping: true,
			indentUnit: 4,
			indentWithTabs: true,
			extraKeys: {
				"Esc": function(cm) {
					if (isFullScreen(cm)) setFullScreen(cm, false);
					resize();
				},
				"Ctrl-S": this.saveevent
			},
			gutters: ["runat", "CodeMirror-linenumbers", "breakpoints"]
		});

		this.roomModel.vars.editor.on("gutterClick", function(cm, n) {
			gutterclick(cm, n);
		});

		gutterclick = function(cm, n) {};
	},

	
	//当对代码的修改已保存时对应的响应函数，用于版本控制
	//?data : undefined , 貌似没用
	
	socket_on_ok: function(socket){

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

		var mother = this;
		
		socket.on('change', function(data) {

			mother.roomModel.lock = true;
			var tfrom = data.from;
			var tto = data.to;
			var ttext = data.text;
			var q = mother.roomModel.q;

			for (var i = 0; i < q.length; i++) {
				if (q[i].to <= tfrom) {
					tfrom += q[i].text.length + q[i].from - q[i].to;
					tto += q[i].text.length + q[i].from - q[i].to;
				} else if (q[i].to <= tto && q[i].from <= tfrom) {
					var tdlen = tto - q[i].to;
					q[i].to = tfrom;
					tfrom = q[i].from + q[i].text.length;
					tto = tfrom + tdlen;
				} else if (q[i].to <= tto && q[i].from > tfrom) {
					tto = tto + q[i].text.length + q[i].from - q[i].to;
					ttext = q[i].text + ttext;
					q[i].from = tfrom;
					q[i].to = tfrom;
				} else if (q[i].to > tto && q[i].from <= tfrom) {
					var qlen = q[i].text.length;
					//q[i].to = q[i].to + ttext.length + tfrom - tto;
					q[i].to = q[i].to + ttext.length + tfrom - tto;
					q[i].text = q[i].text + ttext;
					tfrom = q[i].from + qlen;
					tto = tfrom;
				} else if (q[i].to > tto && q[i].from <= tto) {
					var qdlen = q[i].to - tto;
					tto = q[i].from;
					q[i].from = tfrom + ttext.length;
					q[i].to = q[i].from + qdlen;
				} else if (q[i].from > tto) {
					q[i].from += ttext.length + tfrom - tto;
					q[i].to += ttext.length + tfrom - tto;
				}
				q[i].version++;
				q[i].version = q[i].version % 65536;
			}

			for (var i = 0; i < bq.length; i++) {
				bq[i].version++;
				bq[i].version = bq[i].version % 65536;
			}

			if (mother.roomModel.bufferfrom != -1) {
				if (mother.roomModel.bufferto == -1) {
					if (mother.roomModel.bufferfrom <= tfrom) {
						tfrom += mother.roomModel.buffertext.length;
						tto += mother.roomModel.buffertext.length;
					} else if (mother.bufferfrom <= tto) {
						tto += mother.roomModel.buffertext.length;
						ttext = mother.roomModel.buffertext + ttext;
						mother.roomModel.bufferfrom = tfrom;
					} else {
						mother.roomModel.bufferfrom += ttext.length + tfrom - tto;
					}
				} else {
					if (mother.roomModel.bufferto <= tfrom) {
						tfrom += mother.roomModel.bufferfrom - mother.roomModel.bufferto;
						tto += mother.roomModel.bufferfrom - mother.roomModel.bufferto;
					} else if (mother.roomModel.bufferto <= tto && mother.roomModel.bufferfrom <= tfrom) {
						var tdlen = tto - mother.roomModel.bufferto;
						mother.roomModel.bufferto = tfrom;
						tfrom = mother.roomModel.bufferfrom;
						tto = tfrom + tdlen;
					} else if (mother.roomModel.bufferto <= tto && mother.roomModel.bufferfrom > tfrom) {
						tto = tto + mother.roomModel.bufferfrom - mother.roomModel.bufferto;
						mother.roomModel.bufferfrom = -1;
						mother.roomModel.bufferto = -1;
					} else if (mother.roomModel.bufferto > tto && mother.roomModel.bufferfrom <= tfrom) {
						mother.roomModel.bufferto = mother.roomModel.bufferto + ttext.length + tfrom - tto;
						mother.roomModel.buffertext = mother.roomModel.buffertext + ttext;
						tfrom = mother.roomModel.bufferfrom;
						tto = tfrom;
					} else if (mother.roomModel.bufferto > tto && mother.roomModel.bufferfrom <= tto) {
						var qdlen = mother.roomModel.bufferto - tto;
						tto = mother.roomModel.bufferfrom;
						mother.roomModel.bufferfrom = tfrom + ttext.length;
						mother.roomModel.bufferto = mother.roomModel.bufferfrom + qdlen;
					} else if (mother.roomModel.bufferfrom > tto) {
						mother.roomModel.bufferfrom += ttext.length + tfrom - tto;
						mother.roomModel.bufferto += ttext.length + tfrom - tto;
					}
				}
			}

			var delta = tfrom + ttext.length - tto;
			var editorDoc = mother.globalModel.editor.getDoc();
			var hist = editorDoc.getHistory();
			var donefrom = new Array(hist.done.length);
			var doneto = new Array(hist.done.length);
			for (var i = 0; i < hist.done.length; i++) {
				donefrom[i] = mother.globalModel.editor.indexFromPos(hist.done[i].changes[0].from);
				doneto[i] = mother.globalModel.editor.indexFromPos(hist.done[i].changes[0].to);
			}
			var undonefrom = new Array(hist.undone.length);
			var undoneto = new Array(hist.undone.length);
			for (var i = 0; i < hist.undone.length; i++) {
				undonefrom[i] = editorDoc.indexFromPos(hist.undone[i].changes[0].from);
				undoneto[i] = editorDoc.indexFromPos(hist.undone[i].changes[0].to);
			}
			for (var i = 0; i < hist.done.length; i++) {
				if (doneto[i] <= tfrom) {} else if (doneto[i] <= tto && donefrom[i] <= tfrom) {
					hist.done[i].changes[0].to = mother.globalModel.editor.posFromIndex(tfrom);
					//doneto[i] = tfrom;
				} else if (doneto[i] <= tto && donefrom[i] > tfrom) {
					hist.done[i].changes[0].from = mother.globalModel.editor.posFromIndex(tfrom);
					hist.done[i].changes[0].to = mother.globalModel.editor.posFromIndex(tfrom);
				}
			}
			for (var i = 0; i < hist.undone.length; i++) {
				if (undoneto[i] <= tfrom) {} else if (undoneto[i] <= tto && undonefrom[i] <= tfrom) {
					hist.undone[i].changes[0].to = mother.globalModel.editor.posFromIndex(tfrom);
					//undoneto[i] = tfrom;
				} else if (undoneto[i] <= tto && undonefrom[i] > tfrom) {
					hist.undone[i].changes[0].from = mother.globalModel.editor.posFromIndex(tfrom);
					hist.undone[i].changes[0].to = mother.globalModel.editor.posFromIndex(tfrom);
				}
			}
			//var cursor = editorDoc.getCursor();
			//var curfrom = editor.indexFromPos(cursor);
			mother.globalModel.editor.replaceRange(ttext, mother.globalModel.editor.posFromIndex(tfrom), mother.globalModel.editor.posFromIndex(tto));
			//if (curfrom == tfrom){
			//	this.globalModel.editorDoc.setCursor(cursor);
			//}
			for (var i = 0; i < hist.done.length; i++) {
				if (doneto[i] <= tfrom) {} else if (doneto[i] <= tto && donefrom[i] <= tfrom) {} else if (doneto[i] <= tto && donefrom[i] > tfrom) {} else if (doneto[i] > tto && donefrom[i] <= tfrom) {
					hist.done[i].changes[0].to = mother.globalModel.editor.posFromIndex(doneto[i] + delta);
					/*var arr = ttext.split("\n");
			hist.done[i].changes[0].text[hist.done[i].changes[0].text.length-1] += arr[0];
			arr.shift();
			if (arr.length > 0)
				hist.done[i].changes[0].text = hist.done[i].changes[0].text.concat(arr);*/
				} else if (doneto[i] > tto && donefrom[i] <= tto) {
					hist.done[i].changes[0].from = mother.globalModel.editor.posFromIndex(tfrom + ttext.length);
					hist.done[i].changes[0].to = mother.globalModel.editor.posFromIndex(donefrom[i] + doneto[i] - tto);
				} else if (donefrom[i] > tto) {
					hist.done[i].changes[0].from = mother.globalModel.editor.posFromIndex(donefrom[i] + ttext.length + tfrom - tto);
					hist.done[i].changes[0].to = mother.globalModel.editor.posFromIndex(doneto[i] + ttext.length + tfrom - tto);
				}
			}
			for (var i = 0; i < hist.undone.length; i++) {
				if (undoneto[i] <= tfrom) {} else if (undoneto[i] <= tto && undonefrom[i] <= tfrom) {} else if (undoneto[i] <= tto && undonefrom[i] > tfrom) {} else if (undoneto[i] > tto && undonefrom[i] <= tfrom) {
					hist.undone[i].changes[0].to = mother.globalModel.editor.posFromIndex(undoneto[i] + delta);
					/*var arr = ttext.split("\n");
			hist.undone[i].changes[0].text[hist.undone[i].changes[0].text.length-1] += arr[0];
			arr.shift();
			if (arr.length > 0)
				hist.undone[i].changes[0].text = hist.undone[i].changes[0].text.concat(arr);*/
				} else if (undoneto[i] > tto && undonefrom[i] <= tto) {
					hist.undone[i].changes[0].from = mother.globalModel.editor.posFromIndex(tfrom + ttext.length);
					hist.undone[i].changes[0].to = mother.globalModel.editor.posFromIndex(undonefrom[i] + undoneto[i] - tto);
				} else if (undonefrom[i] > tto) {
					hist.undone[i].changes[0].from = mother.globalModel.editor.posFromIndex(undonefrom[i] + ttext.length + tfrom - tto);
					hist.undone[i].changes[0].to = mother.globalModel.editor.posFromIndex(undoneto[i] + ttext.length + tfrom - tto);
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
			mother.roomModel.doc.text = mother.roomModel.doc.text.substr(0, data.from) + data.text + mother.roomModel.doc.text.substr(data.to);
			mother.roomModel.doc.version++;
			mother.roomModel.doc.version = mother.roomModel.doc.version % 65536;
			if (q.length > 0) {
				socket.emit('change', q[0]);
			}

			var pos = mother.globalModel.editor.posFromIndex(data.from + data.text.length);
			mother.roomModel.cursors[data.name].pos = data.from + data.text.length;
			mother.globalModel.editor.addWidget(pos, mother.roomModel.cursors[data.name].element, false);
		});
	}

});
