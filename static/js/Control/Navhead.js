
///这个文件封装了文件列表页面顶端的navbar，及其相关模块
///包括nav，changepassowrd和changeavartar

/**********************navhead***********************/
var NavHeadControl = can.Control.extend({

	m_global_v: '',

	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/navhead.ejs", {}));
	},

	/////////////////////////////////////////////////events//////////////////////////////////////////

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

//修改密码模块，对应的view为修改密码对话框

var ChangePassControl = can.Control.extend({

	m_global_v: '',

	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/changepass.ejs", {}));
		$('#changepassword').on('shown', function() {
			$('#changepassword-old').focus();
		});
		this.socket_io();
	},

	/////////////////////////////////////////////////events//////////////////////////////////////////

	'#changepass-ok click': function() {
		this.changePassword();
	},

	'#changeavatarbtn click': function(){
		$('#changeavatar-message').slideUp()
	},
	
	'#changepassword-old keydown': function() {
		if (event.keyCode == 13 || event.keyCode == 40)
			$("#changepassword-new").focus();
	},

	'#changepassword-new keydown': function(){
		if (event.keyCode == 13 || event.keyCode == 40)
			$("#changepassword-confirm").focus();
		if(event.keyCode == 38)
			$("#changepassword-old").focus();
	},

	'#changepassword-confirm keydown': function(){
		if (event.keyCode == 13)
			this.changePassword();
		if(event.keyCode == 38)
			$("#changepassword-new").focus();
	},

	//////////////////////////////////logic and business////////////////////////////////

	//客户修改密码的逻辑
	changePassword:function(){
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

	////////////////////////////////////////////socket reaction/////////////////////////////////////

	//服务器响应密码修改
	socket_io:function(){
		m_global_v.socket.on('password', function(data) {
			if (data.err) {
				m_global_v.showmessageindialog('changepassword', data.err, 0);
			} else {
				$('#changepassword').modal('hide');
				m_global_v.showmessagebox('changepassword', 'changepassworddone', 1);
			}
			m_global_v.removeloading('changepassword-buttons');
			m_global_v.operationLock = false;
		});
	}
});
/****************************************************/


/********************changeavatar********************/

//修改头像模块，对应修改头像对话框

var ChangeAvatarControl = can.Control.extend({

	m_global_v: '',

	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/changeavatar.ejs", {}));
		this.socket_io();
	},

	/////////////////////////////////////////////////events//////////////////////////////////////////

	'#changeavatar-input change': function() {
		this.changeavatar($('#changeavatar-input')[0]);
	},

	//////////////////////////////////logic and business////////////////////////////////

	//客户修改头像的逻辑
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

	////////////////////////////////////////////socket reaction/////////////////////////////////////

	//服务器返回更新头像的数据与回调函数
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
