/**********************navhead***********************/
var NavHeadControl = can.Control.extend({
	m_global_v: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/navhead.ejs", {}));
	},
	'#changepasswordopen click': function() {
		$('#changepassword-old').val('');
		$('#changepassword-new').val('');
		$('#changepassword-confirm').val('');
		$('#changepassword .control-group').removeClass('error');
		$('#changepassword .help-inline').text('');
	},
	'#changeavataropen click': function() {
		$('#changeavatar-message').hide();
		$('#changeavatar-img').attr('src', m_global_v.currentUser.avatar);
	},
	'#logout click': function() {
		m_global_v.socket.emit('logout', {});
		$.removeCookie('sid');
		m_global_v.backtologin();
	},
});
/****************************************************/


/******************changepassword********************/
var ChangePassControl = can.Control.extend({
	m_global_v: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/changepass.ejs", {}));
		$('#changepassword').on('shown', function() {
			$('#changepassword-old').focus();
		});
	},
	'#changepass-ok click': function() {
		var old = $('#changepassword-old').val();
		var pass = $('#changepassword-new').val();
		var confirm = $('#changepassword-confirm').val();
		$('#changepassword .control-group').removeClass('error');
		$('#changepassword .help-inline').text('');
		if (pass != confirm) {
			m_global_v.showmessageindialog('changepassword', 'doesntmatch', 2);
			return;
		}
		if (m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.loading('changepassword-buttons');
		m_global_v.socket.emit('password', {
			password: old,
			newPassword: pass
		});
	},
});
/****************************************************/


/********************changeavatar********************/
var ChangeAvatarControl = can.Control.extend({
	m_global_v: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/changeavatar.ejs", {}));
		this.socket_io();
	},
	'#changeavatar-input change': function() {
		this.changeavatar($('#changeavatar-input')[0]);
	},
	changeavatar: function(o) {
		if (o.files.length < 0) {
			m_global_v.showmessage('changeavatar-message', 'selectuser', 'error');
			return;
		}
		if (m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		var file = o.files[0];

		var reader = new FileReader();
		reader.onloadend = function() {
			if (reader.error) {
				m_global_v.showmessage('changeavatar-message', reader.error, 'error');
				m_global_v.operationLock = false;
			} else {
				var s = reader.result;
				var t = s.substr(s.indexOf('base64') + 7);
				if (t.length > 0x100000) {
					m_global_v.showmessage('changeavatar-message', 'too large', 'error');
				}
				m_global_v.socket.emit('avatar', {
					type: file.type,
					avatar: t
				});
			}
		}
		reader.readAsDataURL(file);
	},
	socket_io: function() {
		m_global_v.socket.on('avatar', function(data) {
			if (data.err) {
				m_global_v.showmessage('changeavatar-message', data.err, 'error');
			} else {
				m_global_v.currentUser.avatar = data.url;
				$('#nav-avatar').attr('src', m_global_v.currentUser.avatar);
				$('#changeavatar-img').attr('src', m_global_v.currentUser.avatar);
				$('img.user-' + m_global_v.currentUser.name).attr('src', m_global_v.currentUser.avatar);
				m_global_v.memberlist.refreshpopover(m_global_v.currentUser);
				m_global_v.memberlistdoc.refreshpopover(m_global_v.currentUser);
				m_global_v.showmessage('changeavatar-message', 'changeavatarok');
			}
			m_global_v.operationLock = false;
		});
	}
});
/****************************************************/
