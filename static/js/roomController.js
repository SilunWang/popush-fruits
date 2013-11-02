var ToolbarController = can.Control.extend({

	m_global_v: '',
	m_room_v: '',
	m_room_c: '',
	m_message_c: '',

	init: function(element, options) {
		
		m_global_v = this.options.m_global_v;
		m_room_v = this.options.m_room_v;
		m_room_c = this.options.m_room_c;
		m_message_c = this.options.m_message_c;

		this.element.append(can.view("../ejs/editor-toolbar.ejs", {}));
	},

	'#togglechat click': function() {
		m_room_c.togglechat(this);
	},

	'#editor-debug click': function() {
		if (!m_room_v.debugenabled())
			return;
		if (m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		if (m_room_v.vars.debugLock) {
			m_global_v.socket.emit('kill');
		} else {
			m_global_v.socket.emit('debug', {
				version: m_room_v.vars.doc.version,
				type: m_room_v.vars.ext
			});
		}
	},

	'#editor-console click': function() {
		if (m_room_v.vars.consoleopen) {
			m_room_c.closeconsole();
		} else {
			m_room_c.openconsole();
		}
	},

	'#editor-back click': function() {
		$('#editor').hide();
		$('#filecontrol').show();
		$('#footer').show();

		m_global_v.socket.emit('leave', {});

		m_global_v.refreshfilelist(function() {;
		}, function() {
			$("body").animate({
				scrollTop: m_room_v.vars.oldscrolltop
			});
		});

		m_message_c.leaveVoiceRoom();
	},

	'#editor-run click': function() {
		m_room_c.runCodeConstruct.run();
	},

	'#setFullScreen click': function() {
		m_room_c.editorConstruct.setFullScreen(m_room_v.vars.editor, true);
	}

});

var ChatboxController = can.Control.extend({

	m_global_v: '',
	m_room_v: '',
	m_room_c: '',
	m_rundebug_c: '',
	m_message_c: '',
	m_fullscreen: '',
	m_togglechat: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_room_v = this.options.m_room_v;
		m_room_c = this.options.m_room_c;
		m_rundebug_c = this.options.m_rundebug_c;
		m_message_c = this.options.m_message_c;
		this.element.append(can.view("../ejs/room-chatbox.ejs", {}));
	},
	'#chat click': function() {
		var text = $('#chat-input').val();
		if (text == '')
			return;

		m_global_v.socket.emit('chat', {
			text: text
		});
		$('#chat-input').val('');
	},
	'#voice-on click': function() {
		if (window.novoice)
			return;
		if (window.voiceLock) {
			return;
		}
		window.voiceLock = true;
		window.voiceon = !window.voiceon;
		if (window.voiceon) {
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
						var connection = new RTCMultiConnection(doc.id);
						window.voiceConnection = connection;
						connection.session = "audio-only";
						connection.autoCloseEntireSession = true;

						connection.onNewSession = function(session) {
							if (window.joinedARoom) {
								return;
							}
							connection.join(session, {
								username: username
							});
						};
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
			m_message_c.leaveVoiceRoom();
		}
	}
});

var ConsoleController = can.Control.extend({

	m_global_v: '',
	m_room_v: '',
	m_room_c: '',
	m_fullscreen: '',
	m_rundebug_c: '',

	init: function(element, options){
		m_global_v = this.options.m_global_v;
		m_room_v = this.options.m_room_v;
		m_room_c = this.options.m_room_c;
		m_rundebug_c = this.options.m_rundebug_c;
		this.element.append(can.view("../ejs/console.ejs", {}));
	},
	
	'#console-input keydown': function() {
		if (event.keycode == 13)
			m_rundebug_c.stdin();
	}

});

var VarlistController = can.Control.extend({

	m_global_v: '',
	m_room_v: '',
	m_room_c: '',
	m_rundebug_c: '',
	m_message_c: '',
	m_fullscreen: '',
	self: this,
	init: function(element, options) {

		m_global_v = this.options.m_global_v;
		m_room_v = this.options.m_room_v;
		m_room_c = this.options.m_room_c;
		m_rundebug_c = this.options.m_rundebug_c;
		m_message_c = this.options.m_message_c;

		this.element.append(can.view("../ejs/varlist.ejs", {}));
		//expressionlist init
		m_global_v.expressionlist = expressionList('#varlist-table');
		
		//初始化expressionList
		expressionlist = m_global_v.expressionlist;
		var localRunDebugC = m_rundebug_c;

		expressionlist.renameExpression = function(id) {
			localRunDebugC.expressionlist_renameExpression(id);
		};
		
		expressionlist.renameExpressionDone = function(id) {
			localRunDebugC.expressionlist_renameExpressionDone(id);
		};

		expressionlist.removeExpression = function(id) {
			localRunDebugC.expressionlist_removeExpression(id);
		};

	},

	'#debugstep click': function() {
		if (m_room_v.vars.debugLock && m_room_v.vars.waiting) {
			m_global_v.socket.emit('step', {});
		}
	},
	'#debugnext click': function() {
		if (m_room_v.vars.debugLock && m_room_v.vars.waiting) {
			m_global_v.socket.emit('next', {});
		}
	},
	'#debugfinish click': function() {
		if (m_room_v.vars.debugLock && m_room_v.vars.waiting) {
			m_global_v.socket.emit('finish', {});
		}
	},
	'#debugcontinue click': function() {
		if (m_room_v.vars.debugLock && m_room_v.vars.waiting) {
			m_global_v.socket.emit('resume', {});
		}
	}
});