var ToolbarController = can.Control.extend({
	m_global_v: '',
	m_room_v: '',
	m_room_c: '',
	m_socket_c: '',
	m_fullscreen: '',
	m_togglechat: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_room_v = this.options.m_room_v;
		m_room_c = this.options.m_room_c;
		m_socket_c = this.options.m_socket_c;
		this.element.append(can.view("../ejs/editor-toolbar.ejs", {}));
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

		m_socket_c.leaveVoiceRoom();
	},
	'#editor-run click': function() {
		if (!m_room_v.runenabled())
			return;
		if (m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		if (m_room_v.vars.runLock) {
			m_global_v.socket.emit('kill');
		} else {
			m_global_v.socket.emit('run', {
				version: m_room_v.vars.doc.version,
				type: m_room_v.vars.ext
			});
		}
	},
	'#setFullScreen click': function() {
		var wrap = m_fullscreen.cm.getWrapperElement();
		if (m_fullscreen.full) {
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
		m_fullscreen.cm.refresh();
		m_fullscreen.cm.focus();
	},
	'#togglechat click': function() {
		if (m_global_v.viewswitchLock)
			return;
		if (m_room_v.vars.chatstate) {
			$('#editormain').parent().removeClass('span12');
			$('#editormain').parent().addClass('span9');
			$('#chatbox').show();
			$(m_togglechat.o).html('<i class="icon-forward"></i>');
			$(m_togglechat.o).attr('title', strings['hide-title']);
		} else {
			$('#chatbox').hide();
			$('#editormain').parent().removeClass('span9');
			$('#editormain').parent().addClass('span12');
			$(m_togglechat.o).html('<i class="icon-backward"></i>');
			$(m_togglechat.o).attr('title', strings['show-title']);
		}
		var o = $('#chat-show').get(0);
		o.scrollTop = o.scrollHeight;
		m_global_v.editor.refresh();
		m_room_c.resize();
		m_room_v.vars.chatstate = !m_room_v.vars.chatstate;
	}
});

var ChatboxController = can.Control.extend({

	m_global_v: '',
	m_room_v: '',
	m_room_c: '',
	m_rundebug_c: '',
	m_socket_c: '',
	m_fullscreen: '',
	m_togglechat: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_room_v = this.options.m_room_v;
		m_room_c = this.options.m_room_c;
		m_rundebug_c = this.options.m_rundebug_c;
		m_socket_c = this.options.m_socket_c;
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
			m_socket_c.leaveVoiceRoom();
		}
	}
});

var VarlistController = can.Control.extend({
	m_global_v: '',
	m_room_v: '',
	m_room_c: '',
	m_rundebug_c: '',
	m_socket_c: '',
	m_fullscreen: '',
	m_togglechat: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_room_v = this.options.m_room_v;
		m_room_c = this.options.m_room_c;
		m_rundebug_c = this.m_rundebug_c;
		m_socket_c = this.m_socket_c;
		this.element.append(can.view("../ejs/varlist.ejs", {}));
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