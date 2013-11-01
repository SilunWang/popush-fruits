//////////////////////// Socket Controller //////////////////////////////

/************************************************************************
|    函数名称： SocketController                                                
|    函数功能： 包装了与系统消息、聊天、语音有关的socket.on和相关函数                                            
|    引用： globalModel roomModel roomConstruct     
|	 Author: SilunWang              
*************************************************************************/

var MessageConstruct = can.Construct.extend({}, {

	globalModel: undefined,
	roomModel: undefined,
	roomConstruct: undefined,

	init: function(options) {

		this.globalModel = options.globalModel;
		this.roomModel = options.roomModel;
		this.roomConstruct = options.roomConstruct;
		
		this.socket_on_chat(this.globalModel.socket);
		this.socket_on_deleted(this.globalModel.socket);
		this.socket_on_unshared(this.globalModel.socket);
		this.socket_on_shared(this.globalModel.socket);
		this.socket_on_join(this.globalModel.socket);
		this.socket_on_leave(this.globalModel.socket);
	},


	//接收聊天消息，并显示在屏幕上，data：包含信息内容，发送者，时间
	socket_on_chat: function(socket){
		var mother = this;

		socket.on('chat', function(data) {

			var text = this.globalModel.htmlescape(data.text);
			var time = new Date(data.time);

			mother.roomConstruct.appendtochatbox(data.name, (data.name == currentUser.name ? 'self' : ''), text, time);
		});
	},

	//当文件的拥有着删除这个文件时，给编辑的人的提示处理，data=undefined？
	socket_on_deleted: function(socket){
		var mother = this;
		
		socket.on('deleted', function(data) {
			mother.roomConstruct.closeeditor();
			mother.globalModel.showmessagebox('info', 'deleted', 1);
		});
	},

	//当文件的拥有者更改共享管理时，给编辑的人的提示处理，data存有被取消权限的用户
	socket_on_unshared: function(socket){
		var mother = this;

		socket.on('unshared', function(data) {
			if (data.name == currentUser.name) {
				mother.roomConstruct.closeeditor();
				mother.globalModel.showmessagebox('info', 'you unshared', 1);
			} else {
				mother.globalModel.memberlistdoc.remove(data.name);
				mother.roomConstruct.appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['unshared'], new Date(data.time));
			}
		});
	},

	//当文件的拥有者更改共享管理时，给编辑的人的提示处理，调用时机待确认?
	socket_on_shared: function(socket){
		var mother = this;

		socket.on('shared', function(data) {
			mother.globalModel.memberlistdoc.add(data);
			mother.globalModel.memberlistdoc.setonline(data.name, false);
			mother.globalModel.memberlistdoc.sort();
			mother.roomConstruct.appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['gotshared'], new Date(data.time));
		});
	},


	//有人进入了房间
	//data : {name, time}
	socket_on_join: function(socket){
		var mother = this;

		socket.on('join', function(data) {
			if (data.err) {
				mother.globalModel.showmessageindialog('openeditor', data.err);
				$('#editor').slideUp('fast');
				$('#filecontrol').slideDown('fast');
			} else {
				mother.globalModel.memberlistdoc.setonline(data.name, true);
				mother.globalModel.memberlistdoc.sort();
				mother.roomConstruct.appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['join'], new Date(data.time));
				var cursor = mother.roomConstruct.newcursor(data.name);
				if (cursors[data.name] && cursors[data.name].element)
					$(cursors[data.name].element).remove();
				cursors[data.name] = {
					element: cursor,
					pos: 0
				};
			}
		});
	},

	//有人离开了房间
	//data : {name, time}
	socket_on_leave: function(socket){
		var mother = this;

		socket.on('leave', function(data) {
			mother.globalModel.memberlistdoc.setonline(data.name, false);
			mother.globalModel.memberlistdoc.sort();
			mother.roomConstruct.appendtochatbox(strings['systemmessage'], 'system', data.name + '&nbsp;' + strings['leave'], new Date(data.time));
			if (cursors[data.name]) {
				if (cursors[data.name].element)
					$(cursors[data.name].element).remove();
				delete cursors[data.name];
			}
		});
	},

	//向服务器发送聊天的数据

	chat: function() {
		var text = $('#chat-input').val();
		if (text == '')
			return;

		this.globalModel.socket.emit('chat', {
			text: text
		});
		$('#chat-input').val('');
	},

	//语音控制
	voice: function() {
		if (novoice)
			return;
		if (window.voiceLock) {
			return;
		}
		window.voiceLock = true;
		window.voiceon = !window.voiceon;

		//此时window.voiceon记录了语音是否开始

		if (window.voiceon) {

			//进入语音聊天时，window.joinedARoom = true
			if (window.joinedARoom) {
				return;
			}
			$('#voice-on').addClass('active');
			try {
				var username = $('#nav-user-name').html();
				var dataRef = new Firebase('https://popush.firebaseIO.com/' + doc.id);
				dataRef.once('value', function(snapShot) {
					delete dataRef;
					if (snapShot.val() == null) {
						var connection = new RTCMultiConnection(doc.id);
						window.voiceConnection = connection;
						connection.session = "audio-only";
						connection.autoCloseEntireSession = true;

						//接收到流之后播放对方的话，stream：语音流，一个持续的连接
						//具体内容：{stream: MediaStream, mediaElement: audio, blobURL: "blob:略", type: "local/remote"}
						connection.onstream = function(stream) {
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
							if (window.peerArray[extra.username]) {
								window.peerArray[extra.username].myOnRemoteStream = function(stream) {
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
					} else {
						//?什么时候调用的？snapShot为何不为空
						var connection = new RTCMultiConnection(doc.id);
						window.voiceConnection = connection;
						connection.session = "audio-only";
						connection.autoCloseEntireSession = true;

						//?新建连接
						connection.onNewSession = function(session) {
							if (window.joinedARoom) {
								return;
							}
							connection.join(session, {
								username: username
							});
						};

						//?同上一个
						connection.onstream = function(stream) {
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
							if (ejected) {
								$('#voice-on').removeClass('active');
								while (window.userArray.length > 0) {
									$(window.audioArray[window.userArray.shift()]).remove();
								}
								while (window.peerUserArray.length > 0) {
									var peerUName = window.peerUserArray.shift();
									if (window.peerArray[peerUName]) {
										window.peerArray[peerUName].myOnRemoteStream = function(stream) {
											stream.mediaElement.muted = true;
											return;
										};
									}
								}
								delete window.voiceConnection;
								window.voiceon = !window.voiceon;
							} else {
								$(window.audioArray[extra.username]).remove();
								if (window.peerArray[extra.username]) {
									window.peerArray[extra.username].myOnRemoteStream = function(stream) {
										stream.mediaElement.muted = true;
										return;
									};
								}
							}
						};
						connection.connect();
					}
				});
			} catch (err) {
				alert(err);
			}
		} else {
			this.leaveVoiceRoom();
		}
	},

	//在每次离开房间时调用
	leaveVoiceRoom: function(){
		//?length在什么时候不为0?	
		while (window.userArray.length > 0) {
			$(window.audioArray[window.userArray.shift()]).remove();
		}
		while (window.peerUserArray.length > 0) {
			var peerUName = window.peerUserArray.shift();
			if (window.peerArray[peerUName]) {
				window.peerArray[peerUName].myOnRemoteStream = function(stream) {
					stream.mediaElement.muted = true;
					return;
				};
			}
		}
		if (!window.joinedARoom) {
			return;
		}
		$('#voice-on').removeClass('active');
		window.voiceConnection.myLocalStream.stop();
		window.voiceConnection.leave();
		delete window.voiceConnection;
	}

	/*//?移动文件？没看到这个功能啊
	socket_on_moved: function(socket, data){
		var mother = this;

		socket.on('moved', function(data) {
			
			var thepath = data.newPath.split('/');
			thepath.shift();
			var thename;
			var realname;
			if (dirMode == 'owned') {
				realname = thename = thepath.pop();
				mother.globalModel.currentDir = thepath;
			} else {
				var name = mother.globalModel.currentDir.shift();
				if (thepath.length == 2) {
					thename = thepath[1] + '@' + thepath[0];
					realname = thepath[1];
					mother.globalModel.currentDir = [];
				} else {
					realname = thename = thepath.pop();
					thepath.unshift(thepath.shift() + '/' + thepath.shift());
					mother.globalModel.currentDir = thepath;
				}
				mother.globalModel.currentDir.unshift(name);
			}
			var filepart = realname.split('.');

			mother.roomModel.ext = filepart[filepart.length - 1];
			mother.globalModel.changelanguage(ext);
			mother.roomControl.checkrunanddebug(ext);

			mother.globalModel.appendtochatbox(strings['systemmessage'], 'system', strings['movedto'] + thename, new Date(data.time));
			$('#current-doc').html(htmlescape(thename));
		});
	},*/

});

