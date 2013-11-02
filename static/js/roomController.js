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

		m_global_v.backhome.refreshfilelist(function() 
			{;}, function() {
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
		m_message_c.voice();
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
		if (event.keyCode == 13)
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