//标记是否处于运行状态
var runLock = false;
//标记是否处于调试状态
var debugLock = false;
//标记是否处于“正在保存状态”
var waiting = false;

//标记代码是否可以运行
var runable = true;
//记录可以运行的扩展名
var runableext = [
	'c', 'cpp', 'js', 'py', 'pl', 'rb', 'lua', 'java'
];

//标记代码是否可以调试
var debugable = true;
//记录可以调试的扩展名
var debugableext = [
	'c', 'cpp'
];

var cursors = {};

var docobj;

var lock = false;
var doc;
var q = [];
var timer = null;

//扩展名
var ext;
//?breakpoints queue?
var bq = [];
//一个字符串，描述这个文件每一行的断点信息，1表示有断点，0表示没有断点
var bps = "";
//标记刚刚运行的语句所在行数
var runningline = -1;

//标记控制台是否处于打开状态
var consoleopen = false;

//?
var old_text;
//?
var old_bps;

//将修改加入队列
q._push = q.push;
q.push = function(element) {
	this._push(element);
	setsaving();
}

//将修改出队
q._shift = q.shift;
q.shift = function() {
	var r = this._shift();
	if(this.length == 0 && bufferfrom == -1){ // buffertext == "") {
		//如果本地的修改已经处理完毕，则标记已保存
		setsaved();
	}
	return r;
}

//根据各种状态判断现在是否可运行
function runenabled(){
	return (runable && !debugLock && (!issaving || runLock));
}

//根据各种状态判断现在是否可调试
function debugenabled(){
	return (debugable && !runLock && (!issaving || debugLock));
}

//控制页面上的运行、调试按钮的可用性
function setrunanddebugstate(){
	//解除禁止状态
	$('#editor-run').removeClass('disabled');
	$('#editor-debug').removeClass('disabled');
	//如果不可运行，则禁用运行按钮
	if(!runenabled())
		$('#editor-run').addClass('disabled');
	//如果不可调试，则禁用调试按钮
	if(!debugenabled())
		$('#editor-debug').addClass('disabled');
}

//记录保存的时间
var savetimestamp;
//标记当前是否正在保存
var issaving = false;
//从本地完全出队到更新视图的延时，用途待定
var savetimeout = 500;

//在页面上标记正在保存
function setsaving(){
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
	savetimestamp = 0;
	issaving = true;
	setrunanddebugstate();
}

//标记已经保存，逻辑层面的
function setsaved(){
	savetimestamp = new Date().getTime();
	setTimeout('setsavedthen(' + savetimestamp + ')', savetimeout);
	savetimeout = 500;
}

//在页面上标记已经保存
function setsavedthen(timestamp){
	if(savetimestamp == timestamp) {
		$('#current-doc-state').removeClass('red');
		$('#current-doc-state').text(strings['saved']);
		$('#editor-back').popover('destroy');
		$('#editor-back').attr('title', strings['back']);
		issaving = false;
		setrunanddebugstate();
	}
}

//根据扩展名（参数ext）判断代码是否可被运行
function isrunable(ext) {
	for(var i=0; i<runableext.length; i++) {
		if(runableext[i] == ext)
			return true;
	}
	return false;
}

//根据扩展名（参数ext）判断代码是否可被调试
function isdebugable(ext) {
	for(var i=0; i<debugableext.length; i++) {
		if(debugableext[i] == ext)
			return true;
	}
	return false;
}

//新建一个光标，content：对方的用户名
function newcursor(content) {
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
}

//向服务器发送设置的断点信息
//from:断点之前一行
//to:断点所在的一行
//text:增加断点=1,取消断点=0
function sendbreak(from, to, text) {
	var req = {version:doc.version, from:from, to:to, text:text};
	if(bq.length == 0){
		socket.emit('bps', req);
	}
	bq.push(req);
}

//增加一个断点
//cm:一个codeMirror对象
//n:断点上一行行号
function addbreakpointat(cm, n) {
	var addlen = n - bps.length;
	//在一个人编辑的情况下，addlen始终为负数
	if (addlen > 0){
		var addtext = "";
		for (var i = bps.length; i < n-1; i++){
			addtext += "0";
		}
		addtext += "1";
		//bps += addtext;
		sendbreak(bps.length, bps.length, addtext);
	}
	else{
		//bps = bps.substr(0, n) + "1" + bps.substr(n+1);
		sendbreak(n, n+1, "1");
	}

	var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
	cm.setGutterMarker(n, 'breakpoints', element);
}

//删除一个断点，在增加断点时也会被调用
//cm:一个codeMirror对象
//n:断点上一行行号
//返回值：删除成功则返回1，断点不存在则返回0
function removebreakpointat(cm, n) {
	var info = cm.lineInfo(n);
	if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
		cm.setGutterMarker(n, 'breakpoints', null);
		//bps = bps.substr(0, n) + "0" + bps.substr(n+1);
		sendbreak(n, n+1, "0");
		return true;
	}
	return false;
}

//检查这一行是否有断点
function havebreakat (cm, n) {
	var info = cm.lineInfo(n);
	if (info && info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
		return "1";
	}
	return "0";
}

//根据扩展名（ext）设置代码编辑器左边边栏的点击事件
//如果代码可以被调试，则点击左边栏会增加/删除断点
//该函数在每次进入代码编辑器时调用
function checkrunanddebug(ext) {
	if(ENABLE_RUN) {
		runable = isrunable(ext);
	}
	if(ENABLE_DEBUG) {
		debugable = isdebugable(ext);
		if(debugable) {
			gutterclick = function(cm, n) {
				if(debugLock && !waiting)
					return;
				//如果断点删除失败（本身不存在），则增加断点，否则删除断点
				if (!removebreakpointat(cm, n)){
					addbreakpointat(cm, n);
				}
			};
		} else {
			gutterclick = function(cm, n) { };
		}
		removeallbreakpoints();
	}
	setrunanddebugstate();
}

//调试的时候，在界面标注当前进行在第几行，n：行数
function runtoline(n) {
	if(runningline >= 0) {
		editor.removeLineClass(runningline, '*', 'running');
		editor.setGutterMarker(runningline, 'runat', null);
	}
	if(n >= 0) {
		editor.addLineClass(n, '*', 'running');
		editor.setGutterMarker(n, 'runat', $('<div><img src="images/arrow.png" width="16" height="16" style="min-width:16px;min-width:16px;" /></div>').get(0));
		editor.scrollIntoView({line:n, ch:0});
	}
	runningline = n;
}

//删除所有断点
function removeallbreakpoints() {
	for (var i = 0; i < bps.length; i++){
		if (bps[i] == "1"){
			var info = editor.lineInfo(i);
			if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
				editor.setGutterMarker(i, 'breakpoints', null);
			}
		}
	}
	bps.replace("1", "0");
}

//根据断点的信息初始化网页断点,bpsstr:传入的断点信息
function initbreakpoints(bpsstr) {
	bps = bpsstr;
	for (var i = bpsstr.length; i < editor.lineCount(); i++) {
		bps += "0";
	}
	for (var i = 0; i < bps.length; i++){
		if (bps[i] == "1") {
			var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
			editor.setGutterMarker(i, 'breakpoints', element);
		}
	}
}

var oldscrolltop = 0;

//打开编辑界面的时候会调用，o：关于打开的文件的信息
function openeditor(o) {
	if(operationLock)
		return;
	operationLock = true;
	filelist.loading();
	docobj = o;
	socket.emit('join', {
		path: o.path
	});
}

//关闭编辑界面后的相关操作
function closeeditor() {
	$('#editor').hide();
	$('#filecontrol').show();
	$('#footer').show();

	socket.emit('leave', {
	});

	refreshfilelist(function(){;}, function(){
		$("body").animate({scrollTop: oldscrolltop});
	});

	leaveVoiceRoom();
}

//向服务器发送聊天的数据
function chat() {
	var text = $('#chat-input').val();
	if(text == '')
		return;

	socket.emit('chat', {
		text: text
	});
	$('#chat-input').val('');
}

//处理控制台的输入
function stdin() {
	if(debugLock && waiting)
		return;

	var text = $('#console-input').val();

	//当处于运行等待状态时，发送输入框数据到服务器
	if(runLock || debugLock) {
		socket.emit('stdin', {
			data: text + '\n'
		});
		//在发送之后，也在控制台输出了内容，应当是别的函数调用了appendtoconsole
	} else {
		appendtoconsole(text + '\n', 'stdin');
	}

	$('#console-input').val('');
}

//在按下ctrl+s之后调用的处理函数
function saveevent(cm) {
	if(savetimestamp != 0)
		setsavedthen(savetimestamp);
	savetimestamp = 0;
}

//将聊天的内容显示到屏幕上
//name:发送消息的人，可能是“系统消息”
//type:自己-“self”，系统-“system”，其它人-“”
//time:消息的时间
function appendtochatbox(name, type, content, time) {
	$('#chat-show-inner').append(
		'<p class="chat-element"><span class="chat-name ' + type +
		'">' + name + '&nbsp;&nbsp;' + time.toTimeString().substr(0, 8) + '</span><br />' + content + '</p>'
		);
	var o = $('#chat-show').get(0);
	o.scrollTop = o.scrollHeight;
}

//将文字内容放到控制台
//content:文字内容
//type:类型，输入为stdin，错误stderr，其它undefined
function appendtoconsole(content, type) {
	if(type) {
		type = ' class="' + type + '"';
	} else {
		type = '';
	}
	$('#console-inner').append(
		'<span' + type + '">' + htmlescape(content) + '</span>'
	);
	var o = $('#console-inner').get(0);
	o.scrollTop = o.scrollHeight;
}

$(function() {

	//重设监视变量，在点击监视变量时发生，id：描述点击的位置
	expressionlist.renameExpression = function(id) {
		this.doneall();
		if(debugLock && !waiting)
			return;
		var input = this.elements[id].elem.find('input');
		var span = this.elements[id].elem.find('.title');
		var expression = span.text();
		span.hide();
		input.val($.trim(expression));
		input.show();
		input.focus();
		input.select();
		this.seteditingelem(id);
	};

	//修改监视列表完成时的处理工作，在按下回车或者点击空白时发生
	expressionlist.renameExpressionDone = function(id) {
		var input = this.elements[id].elem.find('input');
		var span = this.elements[id].elem.find('span');
		var expression = $.trim(input.val());
		
		if(debugLock && !waiting) {
			if(!this.elements[id].notnew) {
				this.elements[id].elem.remove();
				delete this.elements[id];
			} else {
				input.hide();
				span.show();
			}
		} else {
			if(this.elements[id].notnew) {
				socket.emit('rm-expr', {
					expr: this.elements[id].expression
				});
			}
			
			if(expression != '') {
				socket.emit('add-expr', {
					expr: expression
				});
			}

			this.elements[id].elem.remove();
			delete this.elements[id];
		}
		this.seteditingelem(null);
	};

	//删除监视的变量
	expressionlist.removeExpression = function(id) {
		this.doneall();
		socket.emit('rm-expr', {
			expr: this.elements[id].expression
		});
	};

});

//接收服务器发送过来的添加监视的信息
socket.on('add-expr', function(data) {
	if(data.expr) {
		expressionlist.addExpression(data.expr);
		expressionlist.setValue(data.expr, data.val);
	}
});

//接收服务器发送过来的移除监视的信息，data:监视的变量名-变量值
socket.on('rm-expr', function(data) {
	expressionlist.removeElementByExpression(data.expr);
});

//接收聊天消息，并显示在屏幕上，data：包含信息内容，发送者，时间
socket.on('chat', function(data) {
	
	var text = htmlescape(data.text);

	var time = new Date(data.time);
	
	appendtochatbox(data.name, (data.name == currentUser.name?'self':''), text, time);
});

//当文件的拥有着删除这个文件时，给编辑的人的提示处理，data=undefined？
socket.on('deleted', function(data) {
	closeeditor();
	showmessagebox('info', 'deleted', 1);
});

//当文件的拥有者更改共享管理时，给编辑的人的提示处理，data存有被取消权限的用户
socket.on('unshared', function(data) {
	if(data.name == currentUser.name) {
		closeeditor();
		showmessagebox('info', 'you unshared', 1);
	} else {
		memberlistdoc.remove(data.name);
		appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['unshared'], new Date(data.time));
	}
});

//当文件的拥有者更改共享管理时，给编辑的人的提示处理，调用时机待确认?
socket.on('shared', function(data) {
	memberlistdoc.add(data);
	memberlistdoc.setonline(data.name, false);
	memberlistdoc.sort();
	appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['gotshared'], new Date(data.time));
});

//?移动文件？没看到这个功能啊
socket.on('moved', function(data) {
	alert("room.js - moved");
	var thepath = data.newPath.split('/');
	thepath.shift();
	var thename;
	var realname;
	if(dirMode == 'owned') {
		realname = thename = thepath.pop();
		currentDir = thepath;
	} else {
		var name = currentDir.shift();
		if(thepath.length == 2) {
			thename = thepath[1] + '@' + thepath[0];
			realname = thepath[1];
			currentDir = [];
		} else {
			realname = thename = thepath.pop();
			thepath.unshift(thepath.shift() + '/' + thepath.shift());
			currentDir = thepath;
		}
		currentDir.unshift(name);
	}
	var filepart = realname.split('.');
	
	ext = filepart[filepart.length - 1];
	changelanguage(ext);
	checkrunanddebug(ext);
	
	appendtochatbox(strings['systemmessage'], 'system', strings['movedto'] + thename, new Date(data.time));
	$('#current-doc').html(htmlescape(thename));
});

//在每次离开房间时调用
function leaveVoiceRoom() {

	//?length在什么时候不为0?	
	while(window.userArray.length > 0) {
		$(window.audioArray[window.userArray.shift()]).remove();
	}
	while(window.peerUserArray.length > 0) {
		var peerUName = window.peerUserArray.shift();
		if(window.peerArray[peerUName]){
			window.peerArray[peerUName].myOnRemoteStream = function (stream){
				stream.mediaElement.muted = true;
				return;
			};
		}
	}
	if(!window.joinedARoom){
		return;
	}
	$('#voice-on').removeClass('active');
	window.voiceConnection.myLocalStream.stop();
	window.voiceConnection.leave();
	delete window.voiceConnection;
}

//语音控制
function voice() {

	if(novoice)
		return;
	if(window.voiceLock){
		return;
	}
	window.voiceLock = true;
	window.voiceon = !window.voiceon;

	//此时window.voiceon记录了语音是否开始

	if(window.voiceon) {

		//进入语音聊天时，window.joinedARoom = true
		if(window.joinedARoom){
			return;
		}
		$('#voice-on').addClass('active');
		try{
			var username = $('#nav-user-name').html();
			var dataRef = new Firebase('https://popush.firebaseIO.com/' + doc.id);
			dataRef.once('value',function(snapShot){
				delete dataRef;
				if (snapShot.val() == null){
					var connection = new RTCMultiConnection(doc.id);
					window.voiceConnection = connection;
					connection.session = "audio-only";
					connection.autoCloseEntireSession = true;

					//接收到流之后播放对方的话，stream：语音流，一个持续的连接
					//具体内容：{stream: MediaStream, mediaElement: audio, blobURL: "blob:略", type: "local/remote"}
					connection.onstream = function (stream) {
						if ((stream.type == 'remote') && (stream.extra.username != username)) {
							stream.mediaElement.style.display = "none";
							stream.mediaElement.muted = false;
							stream.mediaElement.play();
							document.body.appendChild(stream.mediaElement);
							window.userArray.push(stream.extra.username);
							window.audioArray[stream.extra.username] = stream.mediaElement;
						}
					};
					
					//用户断开连接的响应函数
					//参数例子：DP958MPF-5YZXGVI, Object {username: "hongyu"}(对方断开：object是我的名字), true(我主动断开是false，对方断开是true)
					connection.onUserLeft = function(userid, extra, ejected) {
						$(window.audioArray[extra.username]).remove();
						if(window.peerArray[extra.username]){
							window.peerArray[extra.username].myOnRemoteStream = function (stream){
								stream.mediaElement.muted = true;
								return;
							};
						}
					};
					connection.connect();
					
					connection.open({
						extra: {
							username: username
						},
						interval: 1000
					});
				}
				else{
					//?什么时候调用的？snapShot为何不为空
					var connection = new RTCMultiConnection(doc.id);
					window.voiceConnection = connection;
					connection.session = "audio-only";
					connection.autoCloseEntireSession = true;
					
					//?新建连接
					connection.onNewSession = function (session){
						if(window.joinedARoom){
							return;
						}
						connection.join(session, {
							username: username
						});
					};

					//?同上一个
					connection.onstream = function (stream) {
						if ((stream.type == 'remote') && (stream.extra.username != username)) {
							stream.mediaElement.style.display = "none";
							stream.mediaElement.muted = false;
							stream.mediaElement.play();
							window.userArray.push(stream.extra.username);
							window.audioArray[stream.extra.username] = stream.mediaElement;
							document.body.appendChild(stream.mediaElement);
						}
					};

					//?同上一个
					connection.onUserLeft = function(userid, extra, ejected) {
						if(ejected){
							$('#voice-on').removeClass('active');
							while(window.userArray.length > 0){
								$(window.audioArray[window.userArray.shift()]).remove();
							}
							while(window.peerUserArray.length > 0){
								var peerUName = window.peerUserArray.shift();
								if(window.peerArray[peerUName]){
									window.peerArray[peerUName].myOnRemoteStream = function (stream){
										stream.mediaElement.muted = true;
										return;
									};
								}
							}
							delete window.voiceConnection;
							window.voiceon = !window.voiceon;
						}
						else{
							$(window.audioArray[extra.username]).remove();
							if(window.peerArray[extra.username]){
								window.peerArray[extra.username].myOnRemoteStream = function (stream){
									stream.mediaElement.muted = true;
									return;
								};
							}
						}
					};
					connection.connect();
				}
			});
		}
		catch(err){
			alert(err);
		}
	} else {
		leaveVoiceRoom();
	}
}

//要运行一个程序时调用，向服务器传送相应数据
function run() {
	if(!runenabled())
		return;
	if(operationLock)
		return;
	operationLock = true;
	//runLock：如果正在运行，则为true
	if(runLock) {
		socket.emit('kill');
	} else {
		socket.emit('run', {
			version: doc.version,
			type: ext
		});
	}
}

//点击运行时的界面控制
function setrun() {
	runLock = true;
	$('#editor-run').html('<i class="icon-stop"></i>');
	$('#editor-run').attr('title', strings['kill-title']);
	$('#console-inner').html('');
	$('#console-input').val('');
	$('#editor-debug').addClass('disabled');
	$('#console-title').text(strings['console']);
	openconsole();
}

//要调试一个程序时调用，向服务器传送相应数据
function debug() {
	if(!debugenabled())
		return;
	if(operationLock)
		return;
	operationLock = true;
	if(debugLock) {
		socket.emit('kill');
	} else {
		socket.emit('debug', {
			version: doc.version,
			type: ext
		});
	}
}

//调试一个程序时的界面控制
function setdebug() {
	debugLock = true;
	$('#editor-debug').html('<i class="icon-eye-close"></i>');
	$('#editor-debug').attr('title', strings['stop-debug-title']);
	$('#console-inner').html('');
	$('#console-input').val('');
	$('#editor-run').addClass('disabled');
	$('#console-title').text(strings['console']);
	openconsole();
}

//调试-逐语句
function debugstep() {
	if(debugLock && waiting) {
		socket.emit('step', {
		});
	}
}

//调试-逐过程
function debugnext() {
	if(debugLock && waiting) {
		socket.emit('next', {
		});
	}
}

//调试-跳出过程
function debugfinish() {
	if(debugLock && waiting) {
		socket.emit('finish', {
		});
	}
}

//调试-继续
function debugcontinue() {
	if(debugLock && waiting) {
		socket.emit('resume', {
		});
	}
}

//点击“控制台”按钮时触发的响应函数，变更控制台的开关状态
function toggleconsole() {
	if(consoleopen) {
		closeconsole();
	} else {
		openconsole();
	}
}

//关闭控制台显示，不清除控制台内容
function closeconsole() {
	if(!consoleopen)
		return;
	consoleopen = false;
	$('#under-editor').hide();
	$('#editor-console').removeClass('active');
	resize();
}

//打开控制台显示，不清除控制台内容
function openconsole() {
	if(!consoleopen) {
		consoleopen = true;
		$('#under-editor').show();
		$('#editor-console').addClass('active');
		resize();
	}
	$('#console-input').focus();
}

//调整代码编辑页面各个元素的大小以供合理显示
//cbh : chat box height
//$('#member-list-doc') : 共享用户头像列表
//$('#under-editor') : 调试和控制台
function resize() {
	var w;
	var h = $(window).height();
	if(h < 100)
		h = 100;
	var cbh = h-$('#member-list-doc').height()-138;
	//保证chat box有一定的宽度
	var cbhexp = cbh > 100 ? 0 : 100 - cbh;
	if(cbh < 100)
		cbh = 100;
	$('#chat-show').css('height', cbh + 'px');
	$('#chatbox').css('height', (h-83+cbhexp) + 'px');
	w = $('#editormain').parent().width();
	$('#editormain').css('width', w);
	var underh = h > 636 ? 212 : h/3;
	if(!consoleopen)
		underh = 0;
	$('#under-editor').css('height', underh + 'px');
	$('#console').css('width', (w-w/3-2) + 'px');
	$('#varlist').css('width', (w/3-1) + 'px');
	$('#console').css('height', (underh-12) + 'px');
	$('#varlist').css('height', (underh-12) + 'px');
	$('#varlistreal').css('height', (underh-42) + 'px');
	$('#console-inner').css('height', (underh-81) + 'px');
	$('#console-input').css('width', (w-w/3-14) + 'px');
	if(!isFullScreen(editor))
		$('.CodeMirror').css('height', (h-underh-$('#over-editor').height()-90) + 'px');

	w = $('#chat-show').width();
	if(w != 0)
		$('#chat-input').css('width', (w-70) + 'px');
	
	$('#file-list .span10').css('min-height', (h-235) + 'px');
	
	w = $('#login-box').parent('*').width();
	$('#login-box').css('left', ((w-420)/2-30) + 'px');
	w = $('#register-box').parent('*').width();
	$('#register-box').css('left', ((w-420)/2-30) + 'px');
	$('#fullscreentip').css('left', (($(window).width()-$('#fullscreentip').width())/2) + 'px');

	$('#editormain-inner').css('left', (-$(window).scrollLeft()) + 'px');

	editor.refresh();
}

//接收到服务器发送的运行消息
//data : {(uesr)name, time};
socket.on('run', function(data){
	appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;&nbsp;' + strings['runsaprogram'], new Date(data.time));
	setrun();
	operationLock = false;
});

//接收到服务器发送的运行消息
//data : {(uesr)name, time, text（程序）, bps(断点信息字符串)};
socket.on('debug', function(data){
	appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;&nbsp;' + strings['startdebug'], new Date(data.time));
	
	setdebug();

	editor.setOption('readOnly', true);
	old_text = editor.getValue();
	old_bps = bps;
	editor.setValue(data.text);
	removeallbreakpoints();
	initbreakpoints(data.bps);

	var editordoc = editor.getDoc();
	var hist = editordoc.getHistory();
	hist.done.pop();
	editordoc.setHistory(hist);

	operationLock = false;
});

//处理服务器发送的“正在运行”消息
//?data : 一直是null?
socket.on('running', function(data){
	if(!debugLock)
		return;
	waiting = false;
	runtoline(-1);
	$('.debugandwait').addClass('disabled');
	$('#console-title').text(strings['console']);
});

//"等待"消息的处理函数
//在debug条件下出现
//data : {line, exprs}
socket.on('waiting', function(data){
	if(!debugLock)
		return;
	waiting = true;
	if(typeof data.line === 'number'){
		runtoline(data.line - 1);
	}else{
		runtoline(-1);
	}
	//依次设定表达式的值
	for(var k in data.exprs) {
		expressionlist.setValue(k, data.exprs[k]);
	}
	$('.debugandwait').removeClass('disabled');
	if(typeof data.line === 'number')
		$('#console-title').text(strings['console'] + strings['waiting']);
	else if(data.line !== null)
		$('#console-title').text(strings['console'] + strings['waiting'] + '[' + data.line + ']');
	else
		$('#console-title').text(strings['console'] + strings['waiting'] + strings['nosource']);
});

//处理输出
socket.on('stdout', function(data){
	appendtoconsole(data.data);
});

//处理输入
socket.on('stdin', function(data){
	appendtoconsole(data.data, 'stdin');
});

//处理错误流
socket.on('stderr', function(data){
	appendtoconsole(data.data, 'stderr');
});

//处理程序退出
socket.on('exit', function(data){

	operationLock = false;

	if(data.err.code !== undefined)
		appendtochatbox(strings['systemmessage'], 'system', strings['programfinish'] + '&nbsp;' + data.err.code, new Date(data.time));
	else
		appendtochatbox(strings['systemmessage'], 'system', strings['programkilledby'] + '&nbsp;' + data.err.signal, new Date(data.time));

	//运行时退出
	if(runLock) {
		$('#editor-run').html('<i class="icon-play"></i>');
		$('#editor-run').attr('title', strings['run-title']);
		runLock = false;
	}
	//调试时退出
	if(debugLock) {
		editor.setValue(old_text);
		removeallbreakpoints();
		initbreakpoints(old_bps);

		var editordoc = editor.getDoc();
		var hist = editordoc.getHistory();
		hist.done.pop();
		editordoc.setHistory(hist);

		editor.setOption('readOnly', false);	
		if(q.length > 0){
			socket.emit('change', q[0]);
		}
		$('#editor-debug').html('<i class="icon-eye-open"></i>');
		$('#editor-debug').attr('title', strings['debug-title']);
		runtoline(-1);
		for(var k in expressionlist.elements) {
			expressionlist.setValue(expressionlist.elements[k].expression, null);
		}
		debugLock = false;
	}
	setrunanddebugstate();
	$('#console-title').text(strings['console'] + strings['finished']);
});

//有人进入了房间
//data : {name, time}
socket.on('join', function(data){
	if(data.err) {
		showmessageindialog('openeditor', data.err);
		$('#editor').slideUp('fast');
		$('#filecontrol').slideDown('fast');
	} else {
		memberlistdoc.setonline(data.name, true);
		memberlistdoc.sort();
		appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['join'], new Date(data.time));
		var cursor = newcursor(data.name);
		if(cursors[data.name] && cursors[data.name].element)
			$(cursors[data.name].element).remove();
		cursors[data.name] = { element:cursor, pos:0 };
	}
});

//有人离开了房间
//data : {name, time}
socket.on('leave', function(data){
	memberlistdoc.setonline(data.name, false);
	memberlistdoc.sort();
	appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['leave'], new Date(data.time));
	if(cursors[data.name]) {
		if(cursors[data.name].element)
			$(cursors[data.name].element).remove();
		delete cursors[data.name];
	}
});

//进入编辑界面时，显示各种数据
//data : {id, users(hongyu:true, hongdashen:true), version, text, bps, exprs(监视列表的表达式{变量：值})}
socket.on('set', function(data){

	savetimestamp = 1;
	setsavedthen(1);

	q.length = 0;
	bq.length = 0;
	lock = false;

	$('#editor-run').html('<i class="icon-play"></i>');
	$('#editor-run').attr('title', strings['run-title']);
	runLock = false;
	debugLock = false;
	waiting = false;

	$('#current-doc').html(htmlescape(docobj.showname));
	$('#chat-input').val('');
	$('#chat-show-inner').text('');
	$('#editor').show();
	$('#filecontrol').hide();
	$('#footer').hide();
	var filepart = docobj.name.split('.');
	ext = filepart[filepart.length - 1];
	changelanguage(ext);
	checkrunanddebug(ext);

	editor.refresh();
	
	if(currentDir.length == 1) {
		memberlistdoc.fromdoc(docobj);
	}
	memberlistdoc.setalloffline();
	memberlistdoc.setonline(currentUser.name, true);

	for(var k in cursors) {
		$(cursors[k].element).remove();
	}

	cursors = {};
	
	oldscrolltop = $('body').scrollTop();
	
	window.voiceon = false;
	window.voiceLock = false;
	window.userArray = [];
	window.audioArray = {};
	window.joinedARoom = false;
	window.peerArray = {};
	window.peerUserArray = [];

	$('#voice-on').removeClass('active');
	
	operationLock = false;

	lock = true;
	doc = data;
	editor.setValue(doc.text);
	editor.clearHistory();
	editor.setOption('readOnly', false);
	initbreakpoints(data.bps);
	for(var i in data.users) {
		memberlistdoc.setonline(i, true);
		if(i == currentUser.name)
			continue;
		var cursor = newcursor(i);
		if(cursors[i] && cursors[i].element)
			$(cursors[i].element).remove();
		cursors[i] = { element:cursor, pos:0 };
	}
	memberlistdoc.sort();

	filelist.removeloading();
	$('#console-inner').html('');
	closeconsole();
	expressionlist.clear();
	for(var k in data.exprs) {
		expressionlist.addExpression(k);
		expressionlist.setValue(k, data.exprs[k]);
	}
	
	$('#console-title').text(strings['console']);
	
	resize();
	$('body').scrollTop(99999);
	
	if(data.running) {
		setrun();
	}
	if(data.debugging) {
		setdebug();
		editor.setOption('readOnly', true);
		old_text = data.text;
		old_bps = data.bps;
		if(data.state == 'waiting') {
			waiting = true;
			runtoline(data.line - 1);
			$('.debugandwait').removeClass('disabled');
			if(data.line !== null)
				$('#console-title').text(strings['console'] + strings['waiting']);
			else
				$('#console-title').text(strings['console'] + strings['waiting'] + strings['nosource']);
		}
	}
	setrunanddebugstate();

	delete data.running;
	delete data.debugging;
	delete data.state;
});

//当对代码的修改已保存时对应的响应函数，用于版本控制
//?data : undefined , 貌似没用
socket.on('ok', function(data){
	var chg = q.shift();
	if(!chg)
		return;
	doc.text = doc.text.substr(0, chg.from) + chg.text + doc.text.substr(chg.to);
	doc.version++;
	doc.version = doc.version % 65536;
	for(var i = 0; i < q.length; i++){
		q[i].version++;
		q[i].version = q[i].version % 65536;
	}
	for(var i = 0; i < bq.length; i++){
		bq[i].version++;
		bq[i].version = bq[i].version % 65536;
	}
	if(q.length > 0){
		socket.emit('change', q[0]);
	}
	if (bq.length > 0){
		socket.emit('bps', bq[0]);
	}
});

//设置一个断点时的响应函数 breakpoints_ok
//?data : undefined , 貌似没用
//本函数在自己设置断点时被调用
socket.on('bpsok', function(data){
	var chg = bq.shift();
	//chg例子 : Object {version: 2, from: 7, to: 8, text: "1"} 
	//text == 1 表示增加断点, text == 0 表示删除断点
	if (!chg)
		return;
	bps = bps.substr(0, chg.from) + chg.text + bps.substr(chg.to);
	if(debugLock)
		old_bps = old_bps.substr(0, chg.from) + chg.text + old_bps.substr(chg.to);
	doc.version++;
	doc.version = doc.version % 65536;
	for(var i = 0; i < q.length; i++){
		q[i].version++;
		q[i].version = q[i].version % 65536;
	}
	for(var i = 0; i < bq.length; i++){
		bq[i].version++;
		bq[i].version = bq[i].version % 65536;
	}
	if(q.length > 0){
		socket.emit('change', q[0]);
	}
	if (bq.length > 0){
		socket.emit('bps', bq[0]);
	}
});

//设置一个断点时的响应函数 breakpoints
//data例子 : Object {version: 5, from: 7, to: 8, text: "1", name: "hongshaoyu2008"}
//本函数在他人设置断点时被调用
socket.on('bps', function(data){
	var tfrom = data.from;
	var tto = data.to;
	var ttext = data.text;
	for (var i = 0; i < bq.length; i++){
		if (bq[i].to <= tfrom){
			tfrom += bq[i].text.length + bq[i].from - bq[i].to;
			tto += bq[i].text.length + bq[i].from - bq[i].to;
		}
		else if (bq[i].to <= tto && bq[i].from <= tfrom){
			var tdlen = tto - bq[i].to;
			bq[i].to = tfrom;
			tfrom = bq[i].from + bq[i].text.length;
			tto = tfrom + tdlen;
		}
		else if (bq[i].to <= tto && bq[i].from > tfrom){
			tto = tto + bq[i].text.length + bq[i].from - bq[i].to;
			ttext = bq[i].text + ttext;
			bq[i].from = tfrom;
			bq[i].to = tfrom;					
		}
		else if (bq[i].to > tto && bq[i].from <= tfrom){
			var bqlen = bq[i].text.length;
			//q[i].to = q[i].to + ttext.length + tfrom - tto;
			bq[i].to = bq[i].to + ttext.length + tfrom - tto;
			bq[i].text = bq[i].text + ttext;
			tfrom = bq[i].from + bqlen;
			tto = tfrom;
		}
		else if (bq[i].to > tto && bq[i].from <= tto){
			var bqdlen = bq[i].to - tto;
			tto = bq[i].from;
			bq[i].from = tfrom + ttext.length;
			bq[i].to = bq[i].from + bqdlen;
		}
		else if (bq[i].from > tto){
			bq[i].from += ttext.length + tfrom - tto;
			bq[i].to += ttext.length + tfrom - tto;
		}
		bq[i].version++;
		bq[i].version = bq[i].version % 65536;
	}
	for (var i = 0; i < q.length; i++){
		q[i].version++;
		q[i].version = q[i].version % 65536;
	}
	bps = bps.substr(0, data.from) + data.text + bps.substr(data.to);
	if(debugLock)
		old_bps = old_bps.substr(0, data.from) + data.text + old_bps.substr(data.to);
	if (data.to == data.from + 1){
		if (data.text == "1"){
			var element = $('<div><img src="images/breakpoint.png" /></div>').get(0);
			editor.setGutterMarker(data.from, 'breakpoints', element);
		}
		else if (data.text == "0"){
			var info = editor.lineInfo(data.from);
			if (info.gutterMarkers && info.gutterMarkers["breakpoints"]) {
				editor.setGutterMarker(data.from, 'breakpoints', null);
			}
		}
	}
	doc.version++
	doc.version = doc.version % 65536;
	if(bq.length > 0){
		socket.emit('bps', bq[0]);
	}
});

//协同编辑算法
//object : {version: 57, from: 150, to: 150, text: "fdfd", name: "hongshaoyu2008"}
//别人更改代码时才会调用
socket.on('change', function(data){
	lock = true;
	var tfrom = data.from;
	var tto = data.to;
	var ttext = data.text;
	for (var i = 0; i < q.length; i++){
		if (q[i].to <= tfrom){
			tfrom += q[i].text.length + q[i].from - q[i].to;
			tto += q[i].text.length + q[i].from - q[i].to;
		}
		else if (q[i].to <= tto && q[i].from <= tfrom){
			var tdlen = tto - q[i].to;
			q[i].to = tfrom;
			tfrom = q[i].from + q[i].text.length;
			tto = tfrom + tdlen;
		}
		else if (q[i].to <= tto && q[i].from > tfrom){
			tto = tto + q[i].text.length + q[i].from - q[i].to;
			ttext = q[i].text + ttext;
			q[i].from = tfrom;
			q[i].to = tfrom;					
		}
		else if (q[i].to > tto && q[i].from <= tfrom){
			var qlen = q[i].text.length;
			//q[i].to = q[i].to + ttext.length + tfrom - tto;
			q[i].to = q[i].to + ttext.length + tfrom - tto;
			q[i].text = q[i].text + ttext;
			tfrom = q[i].from + qlen;
			tto = tfrom;
		}
		else if (q[i].to > tto && q[i].from <= tto){
			var qdlen = q[i].to - tto;
			tto = q[i].from;
			q[i].from = tfrom + ttext.length;
			q[i].to = q[i].from + qdlen;
		}
		else if (q[i].from > tto){
			q[i].from += ttext.length + tfrom - tto;
			q[i].to += ttext.length + tfrom - tto;
		}
		q[i].version++;
		q[i].version = q[i].version % 65536;
	}
	for (var i = 0; i < bq.length; i++){
		bq[i].version++;
		bq[i].version = bq[i].version % 65536;
	}
	if (bufferfrom != -1){
		if (bufferto == -1){
			if (bufferfrom <= tfrom){
				tfrom += buffertext.length;
				tto += buffertext.length;
			}
			else if (bufferfrom <= tto){
				tto += buffertext.length;
				ttext = buffertext + ttext;
				bufferfrom = tfrom;
			}
			else {
				bufferfrom += ttext.length + tfrom - tto;
			}
		}
		else{
			if (bufferto <= tfrom){
				tfrom += bufferfrom - bufferto;
				tto += bufferfrom - bufferto;
			}
			else if (bufferto <= tto && bufferfrom <= tfrom){
				var tdlen = tto - bufferto;
				bufferto = tfrom;
				tfrom = bufferfrom;
				tto = tfrom + tdlen;
			}
			else if (bufferto <= tto && bufferfrom > tfrom){
				tto = tto + bufferfrom - bufferto;
				bufferfrom = -1;
				bufferto = -1;					
			}
			else if (bufferto > tto && bufferfrom <= tfrom){
				bufferto = bufferto + ttext.length + tfrom - tto;
				buffertext = buffertext + ttext;
				tfrom = bufferfrom;
				tto = tfrom;
			}
			else if (bufferto > tto && bufferfrom <= tto){
				var qdlen = bufferto - tto;
				tto = bufferfrom;
				bufferfrom = tfrom + ttext.length;
				bufferto = bufferfrom + qdlen;
			}
			else if (bufferfrom > tto){
				bufferfrom += ttext.length + tfrom - tto;
				bufferto += ttext.length + tfrom - tto;
			}
		}
	}
	var delta = tfrom + ttext.length - tto;
	var editorDoc = editor.getDoc();
	var hist = editorDoc.getHistory();
	var donefrom = new Array(hist.done.length);
	var doneto = new Array(hist.done.length);
	for (var i = 0; i < hist.done.length; i++) {
		donefrom[i] = editor.indexFromPos(hist.done[i].changes[0].from);
		doneto[i] = editor.indexFromPos(hist.done[i].changes[0].to);
	}
	var undonefrom = new Array(hist.undone.length);
	var undoneto = new Array(hist.undone.length);
	for (var i = 0; i < hist.undone.length; i++) {
		undonefrom[i] = editorDoc.indexFromPos(hist.undone[i].changes[0].from);
		undoneto[i] = editorDoc.indexFromPos(hist.undone[i].changes[0].to);
	}
	for (var i = 0; i < hist.done.length; i++){
		if (doneto[i] <= tfrom){
		}
		else if (doneto[i] <= tto && donefrom[i] <= tfrom){
			hist.done[i].changes[0].to = editor.posFromIndex(tfrom);
			//doneto[i] = tfrom;
		}
		else if (doneto[i] <= tto && donefrom[i] > tfrom){
			hist.done[i].changes[0].from = editor.posFromIndex(tfrom);
			hist.done[i].changes[0].to = editor.posFromIndex(tfrom);					
		}
	}
	for (var i = 0; i < hist.undone.length; i++){
		if (undoneto[i] <= tfrom){
		}
		else if (undoneto[i] <= tto && undonefrom[i] <= tfrom){
			hist.undone[i].changes[0].to = editor.posFromIndex(tfrom);
			//undoneto[i] = tfrom;
		}
		else if (undoneto[i] <= tto && undonefrom[i] > tfrom){
			hist.undone[i].changes[0].from = editor.posFromIndex(tfrom);
			hist.undone[i].changes[0].to = editor.posFromIndex(tfrom);					
		}
	}
	//var cursor = editorDoc.getCursor();
	//var curfrom = editor.indexFromPos(cursor);
	editor.replaceRange(ttext, editor.posFromIndex(tfrom), editor.posFromIndex(tto));
	//if (curfrom == tfrom){
	//	editorDoc.setCursor(cursor);
	//}
	for (var i = 0; i < hist.done.length; i++){
		if (doneto[i] <= tfrom){
		}
		else if (doneto[i] <= tto && donefrom[i] <= tfrom){					
		}
		else if (doneto[i] <= tto && donefrom[i] > tfrom){		
		}
		else if (doneto[i] > tto && donefrom[i] <= tfrom){
			hist.done[i].changes[0].to = editor.posFromIndex(doneto[i] + delta);
			/*var arr = ttext.split("\n");
			hist.done[i].changes[0].text[hist.done[i].changes[0].text.length-1] += arr[0];
			arr.shift();
			if (arr.length > 0)
				hist.done[i].changes[0].text = hist.done[i].changes[0].text.concat(arr);*/
		}				
		else if (doneto[i] > tto && donefrom[i] <= tto){
			hist.done[i].changes[0].from = editor.posFromIndex(tfrom + ttext.length);
			hist.done[i].changes[0].to = editor.posFromIndex(donefrom[i] + doneto[i] - tto);
		}
		else if (donefrom[i] > tto){
			hist.done[i].changes[0].from = editor.posFromIndex(donefrom[i] + ttext.length + tfrom - tto);
			hist.done[i].changes[0].to = editor.posFromIndex(doneto[i] + ttext.length + tfrom - tto);
		}
	}
	for (var i = 0; i < hist.undone.length; i++){
		if (undoneto[i] <= tfrom){
		}
		else if (undoneto[i] <= tto && undonefrom[i] <= tfrom){					
		}
		else if (undoneto[i] <= tto && undonefrom[i] > tfrom){		
		}
		else if (undoneto[i] > tto && undonefrom[i] <= tfrom){
			hist.undone[i].changes[0].to = editor.posFromIndex(undoneto[i] + delta);
			/*var arr = ttext.split("\n");
			hist.undone[i].changes[0].text[hist.undone[i].changes[0].text.length-1] += arr[0];
			arr.shift();
			if (arr.length > 0)
				hist.undone[i].changes[0].text = hist.undone[i].changes[0].text.concat(arr);*/
		}				
		else if (undoneto[i] > tto && undonefrom[i] <= tto){
			hist.undone[i].changes[0].from = editor.posFromIndex(tfrom + ttext.length);
			hist.undone[i].changes[0].to = editor.posFromIndex(undonefrom[i] + undoneto[i] - tto);
		}
		else if (undonefrom[i] > tto){
			hist.undone[i].changes[0].from = editor.posFromIndex(undonefrom[i] + ttext.length + tfrom - tto);
			hist.undone[i].changes[0].to = editor.posFromIndex(undoneto[i] + ttext.length + tfrom - tto);
		}
	}
	for (var i = 0; i < hist.done.length; i++){
		hist.done[i].anchorAfter = hist.done[i].changes[0].from;
		hist.done[i].anchorBefore = hist.done[i].changes[0].from;
		hist.done[i].headAfter = hist.done[i].changes[0].from;
		hist.done[i].headBefore = hist.done[i].changes[0].from;
	}
	for (var i = 0; i < hist.undone.length; i++){
		hist.undone[i].anchorAfter = hist.undone[i].changes[0].from;
		hist.undone[i].anchorBefore = hist.undone[i].changes[0].from;
		hist.undone[i].headAfter = hist.undone[i].changes[0].from;
		hist.undone[i].headBefore = hist.undone[i].changes[0].from;
	}
	editorDoc.setHistory(hist);
	doc.text = doc.text.substr(0, data.from) + data.text + doc.text.substr(data.to);
	doc.version++;
	doc.version = doc.version % 65536;
	if(q.length > 0){
		socket.emit('change', q[0]);
	}
	
	var pos = editor.posFromIndex(data.from + data.text.length);
	cursors[data.name].pos = data.from + data.text.length;
	editor.addWidget(pos, cursors[data.name].element, false);
});

var buffertext = "";
var bufferfrom = -1;
var bufferto = -1;
var buffertimeout = SAVE_TIME_OUT;

//将自己修改的一段文字发送给服务器
//buffertimeout = 1000
//buffertext : 输入的内容，删除为”“
//bufferfrom != -1 && bufferto != -1 -- 用backspace删除
//bufferfrom != -1 && bufferto == -1 -- 普通的输入
//bufferfrom == -1 && bufferto == -1 -- 选中一段文字删除
//选中一段文字修改 : 输入多个字母的话，同普通的输入
function sendbuffer(){
	if (bufferfrom != -1) {
		if (bufferto == -1){
			var req = {version:doc.version, from:bufferfrom, to:bufferfrom, text:buffertext};
			if(q.length == 0){
				socket.emit('change', req);
			}
			q.push(req);
			buffertext = "";
			bufferfrom = -1;
		}
		else {
			var req = {version:doc.version, from:bufferfrom, to:bufferto, text:buffertext};
			if(q.length == 0){
				socket.emit('change', req);
			}
			q.push(req);
			bufferfrom = -1;
			bufferto = -1;
		}
		buffertimeout = SAVE_TIME_OUT;
	}
}

//设置保存
//?没找到什么时候调用
function save(){
	setsaving();
	if (timer != null){
		clearTimeout(timer);
	}
	timer = setTimeout("sendbuffer()", buffertimeout);
}

//给CodeMirror添加监听者
//即，在代码编辑器上的变动能够被对应函数响应
//在网页启动的时候调用
function registereditorevent() {

	//chg（例子） : Object {from: Pos, to: Pos, text: Array[5], origin: "setValue", removed: Array[7]}
	//text : 新打开的文档内容
	//removed : 上次打开的文档内容
	//editorDoc(例子) : window.CodeMirror.CodeMirror.Doc {children: Array[1], size: 5, height: 2352, parent: null, first: 0…}
	CodeMirror.on(editor.getDoc(), 'change', function(editorDoc, chg){
		
		if(debugLock){
			return true;
		}

		if(lock){
			lock = false;
			return true;
		}

		var cfrom = editor.indexFromPos(chg.from);
		var cto = editor.indexFromPos(chg.to);
		var removetext = "";
		for (var i = 0; i < chg.removed.length - 1; i++){
			removetext += chg.removed[i] + '\n';
		}
		removetext += chg.removed[chg.removed.length - 1];
		cto = cfrom + removetext.length;
		var cattext = "";
		for (var i = 0; i < chg.text.length - 1; i++){
			cattext += chg.text[i] + '\n';
		}
		cattext += chg.text[chg.text.length - 1];

		var delta = cfrom + cattext.length - cto;

		for (var k in cursors){
			if (cto <= cursors[k].pos){
				cursors[k].pos += delta;
				editor.addWidget(editor.posFromIndex(cursors[k].pos), cursors[k].element, false);
			}
			else if (cfrom < cursors[k].pos) {
				cursors[k].pos = cfrom + cattext.length;
				editor.addWidget(editor.posFromIndex(cursors[k].pos), cursors[k].element, false);
			}
		}
		
		/*if (cfrom == cto && 
			(cfrom == bufferfrom + buffertext.length || bufferfrom == -1)
			&& cattext.length == 1 && 
			((cattext[0] >= 'a' && cattext[0] <= 'z') || (cattext[0] >= 'A' && cattext[0] <= 'Z') ||
			(cattext[0] >= '0' && cattext[0] <= '9'))){
			if (bufferfrom == -1){
				buffertext = cattext;
				bufferfrom = cfrom;
			}
			else {
				buffertext += cattext;
			}
			save();
			return;
		}*/
		var bfrom = chg.from.line;
		var bto = chg.to.line;

		if (chg.text.length != (bto-bfrom+1)){
			sendbuffer();
			var req = {version:doc.version, from:cfrom, to:cto, text:cattext};
			if(q.length == 0){
				socket.emit('change', req);
			}
			q.push(req);
			var btext = "";
			for (var i = 0; i < chg.text.length; i++){
				btext += havebreakat(editor, bfrom + i);
			}
			/*
			if (chg.text[0] == "")
				btext = havebreakat(editor, bfrom);
			//var btext = "";
			for (var i = 0; i < chg.text.length - 2; i++){
				btext += "0";
			}
			btext[btext.length-1] = bps[bto];*/
			sendbreak(bfrom, bto+1, btext);
			return;
		}
		if (chg.text.length > 1){
			buffertimeout = buffertimeout / 2;
		}
		if (bufferto == -1 && cfrom == cto &&
			(cfrom ==  bufferfrom + buffertext.length ||  bufferfrom == -1)){
			if (bufferfrom == -1){
				buffertext = cattext;
				bufferfrom = cfrom;
			}
			else {
				buffertext += cattext;
			}
			save();
			return;
		}
		else if (bufferto == -1 && chg.origin == "+delete" &&
			bufferfrom != -1 && cto == bufferfrom + buffertext.length && cfrom >= bufferfrom){
			buffertext = buffertext.substr(0, cfrom - bufferfrom);
			if (buffertext.length == 0){
				bufferfrom = -1;
				if(q.length == 0){
					setsaved();
				}
				return;
			}
			save();
			return;
		}
		else if (chg.origin == "+delete" &&
			bufferfrom == -1){
			bufferfrom = cfrom;
			bufferto = cto;
			buffertext = "";
			save();
			return;
		}
		else if (bufferto != -1 && chg.origin == "+delete" &&
			cto == bufferfrom){
			bufferfrom = cfrom;
			save();
			return;
		}
		else if (bufferfrom != -1) {
			if (bufferto == -1){
				var req = {version:doc.version, from:bufferfrom, to:bufferfrom, text:buffertext};
				if(q.length == 0){
					socket.emit('change', req);
				}
				q.push(req);
				buffertext = "";
				bufferfrom = -1;
			}
			else {
				var req = {version:doc.version, from:bufferfrom, to:bufferto, text:buffertext};
				if(q.length == 0){
					socket.emit('change', req);
				}
				q.push(req);
				bufferfrom = -1;
				bufferto = -1;
			}
		}
		
		var req = {version:doc.version, from:cfrom, to:cto, text:cattext};
		if(q.length == 0){
			socket.emit('change', req);
		}
		q.push(req);
		
	});

}
