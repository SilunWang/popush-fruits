/*********************Login part*********************/

var LoginControl = can.Control.extend({
	m_global_v: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/login.ejs", {}));
		this.socket_io();
		this.resize();
	},

	//reaction area
	'#login-submit click': function() {
		this.login();
	},

	'#login-to-register click': function() {
		this.registerview();
	},

	//business
	login: function() {
		console.log("a");
		//获取输入框的数据
		var login_name = $('#login-inputName').val();
		var login_pass = $('#login-inputPassword').val();
		//名字输入为空
		if (login_name == '') {
			m_global_v.showmessage('login-message', 'pleaseinput', 'error');
			return;
		}
		//如果
		if (m_global_v.loginLock)
			return;
		m_global_v.loginLock = true;
		m_global_v.loading('login-control');
		//socket请求，发送用户名和密码，待服务器端接收。
		m_global_v.socket.emit('login', {
			name: login_name,
			password: login_pass
		});
	},


	registerview: function() {
		if (m_global_v.viewswitchLock)
			return;
		m_global_v.viewswitchLock = true;
		$('#login .blink').fadeOut('fast');
		$('#login-message').slideUp();
		$('#login-padding').slideDown('fast', function() {
			$('#register').show();
			$('#register .blink').fadeIn('fast');
			$('#login').hide();
			$('#register-inputName').val('');
			$('#register-inputPassword').val('');
			$('#register-confirmPassword').val('');
			$('#register-message').hide();
			$('#register-padding').fadeIn('fast', function() {
				$('#register-inputName').focus();
				m_global_v.viewswitchLock = false;
			});
			var w = $('#register-box').parent('*').width();
			$('#register-box').css('left', ((w - 420) / 2 - 30) + 'px');
		});
	},

	resize: function() {
		var w = $('#login-box').parent('*').width();
		$('#login-box').css('left', ((w - 420) / 2 - 30) + 'px');
		$('#login-inputName').focus();
	},

	socket_io: function() {
		m_global_v.socket.on('login', function(data) {
			if (data.err) {
				//如果cookie期满了
				if (data.err == 'expired') {
					//移除cookie
					$.removeCookie('sid');
				} else {
					m_global_v.showmessage('login-message', data.err, 'error');
				}
			} else {
				//上锁
				m_global_v.operationLock = false;
				//一群东西出现和消失
				$('#login-inputName').val('');
				$('#login-inputPassword').val('');
				$('#login-message').hide();
				$('#ownedfile').show();
				$('#ownedfileex').hide();
				$('#sharedfile').removeClass('active');
				$('#share-manage-link').hide();
				$('#big-one').animate({
					height: '40px',
					padding: '0',
					'margin-bottom': '20px'
				}, 'fast');
				$('#nav-head').fadeIn('fast');
				$('#login').hide();
				$('#editor').hide();
				$('#filecontrol').fadeIn('fast');
				$('#nav-user-name').text(data.user.name);
				$('#nav-avatar').attr('src', data.user.avatar);
				m_global_v.currentUser = data.user;
				//向cookie写入sid
				$.cookie('sid', data.sid, {
					expires: 7
				});
				//当前的路径模式改为拥有的文件
				m_global_v.dirMode = 'owned';

				//currenDir修改为当前user的name
				m_global_v.currentDir = [data.user.name];
				m_global_v.attr("model_currentDir", m_global_v.currentDir);
				m_global_v.currentDirString = m_global_v.getdirstring();
				m_global_v.docshowfilter = {
					flag: 1,
					currentDir: m_global_v.currentDir,
					currentUser: m_global_v.currentUser,
					htmlescape:m_global_v.htmlescape
				};
				//获取当前的link
				//$('#current-dir').html(m_global_v.getdirlink());
				//
				m_global_v.filelist.setmode(3);
				m_global_v.attr("model_mode",3);
				m_global_v.attr("model_filelist",m_global_v.filelist.formdocs(data.user.docs, m_global_v.docshowfilter));

				m_global_v.memberlist.clear();
				m_global_v.memberlist.add(data.user);
			}
			m_global_v.cleanloading();
			m_global_v.loginLock = false;
		});
		m_global_v.socket.on('unauthorized', function() {
			m_global_v.backtologin();
			m_global_v.showmessage('login-message', 'needrelogin', 'error');

			if (!window.joinedARoom) {
				return;
			}
			window.joinedARoom = false;
			window.voiceConnection.myLocalStream.stop();
			window.voiceConnection.leave();
			while (window.userArray.length > 0) {
				$(window.audioArray[window.userArray.shift()]).remove();
			}
			delete window.voiceConnection;
		});

		m_global_v.socket.on('version', function(data) {
			if (data.version != VERSION) {
				location.reload('Refresh');
			}
			if (m_global_v.failed)
				return;
			if (!m_global_v.firstconnect) {
				m_global_v.backtologin();
			}
			m_global_v.firstconnect = false;
			$('#loading-init').remove();
			m_global_v.cleanloading();
			if ($.cookie('sid')) {
				socket.emit('relogin', {
					sid: $.cookie('sid')
				});
				m_global_v.loading('login-control');
				m_global_v.loginLock = true;
			} else {
				$('#login-control').fadeIn('fast');
			}
			m_global_v.loadDone = true;
		});

		m_global_v.socket.on('connect', function() {
			m_global_v.socket.emit('version', {});
		});
	}
});
/****************************************************/

/************************Resgister part***********************/

var RegisterController = can.Control.extend({
	m_global_v: '',
	m_register_information: '',
	self: this,
	init: function(element, options) {
		self.m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/register.ejs", {}));
		this.socket_io();
		this.keyup();
		this.focus();
	},

	'#register-submit click': function() {
		this.register();
	},

	'#register-to-login click': function() {
		this.loginview();
	},

	keyup: function() {
		self = this;
		$('#register-inputName').keyup(function() {
			self.checkusername();
		});
	},

	focus:function(){
		$('#register-inputName').focus(function(){
			$("#msg-username").html(m_global_v.strings['name invalid'] + "," + m_global_v.strings['namelength']);
		});

		$('#register-inputPassword').focus(function(){
			var name = $('#register-inputName').val();
			if(!/^[A-Za-z0-9]*$/.test(name)) {
				$("#msg-username").html(m_global_v.strings['name invalid']);
				$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
				$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
				return;
			}
			if(name == "" || name.length < 6 || name.length > 20) {
				$("#msg-username").html(m_global_v.strings['namelength']);
				$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
				$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
				return;
			}
			return;
		});

		$("#register-confirmPassword").focus(function(){
			var name = $('#register-inputName').val();
			if(!/^[A-Za-z0-9]*$/.test(name)) {
				$("#msg-username").html(m_global_v.strings['name invalid']);
				$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
				$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
				return;
			}
			if(name.length < 6 || name.length > 20) {
				$("#msg-username").html(m_global_v.strings['namelength']);
				$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
				$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
				return;
			}
			return;
		});
	},


	///logics 
	register:function() {
		var registername = $('#register-inputName').val();
		var pass = $('#register-inputPassword').val();
		var confirm = $('#register-confirmPassword').val();
		if (!/^[A-Za-z0-9]*$/.test(registername)) {
			m_global_v.showmessage('register-message', 'name invalid');
			return;
		}
		if (registername.length < 6 || registername.length > 20) {
			m_global_v.showmessage('register-message', 'namelength');
			return;
		}
		if (pass.length > 32) {
			m_global_v.showmessage('register-message', 'passlength');
			return;
		}
		if (pass != confirm) {
			m_global_v.showmessage('register-message', 'doesntmatch');
			return;
		}
		if (m_global_v.registerLock)
			return;
		m_global_v.registerLock = true;
		m_global_v.loading('register-control');
		m_global_v.socket.emit('register', {
			name: registername,
			password: pass,
			avatar: 'images/character.png'
		});
	},

	loginview: function() {
		if (m_global_v.viewswitchLock)
			return;
		m_global_v.viewswitchLock = true;
		$('#register .blink').fadeOut('fast');
		$('#register-message').slideUp();
		$('#register-padding').fadeOut('fast', function() {
			$('#login').show();
			$('#login .blink').fadeIn('fast');
			$('#register').hide();
			$('#login-inputName').val('');
			$('#login-inputPassword').val('');
			$('#login-message').hide();
			$('#login-padding').slideUp('fast', function() {
				$('#login-inputName').focus();
				m_global_v.viewswitchLock = false;
			});
			var w = $('#login-box').parent('*').width();
			$('#login-box').css('left', ((w - 420) / 2 - 30) + 'px');
		});
	},

	checkusername: function() {
		var name = $('#register-inputName').val();
		if(name.length == "") {
			$("#msg-username").html(m_global_v.strings['name invalid'] + "," + m_global_v.strings['namelength']);
			$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px -160px transparent");
			$('#register-inputName').css("border-color","rgba(82,168,236,0.8)");	
			return;
		}
		if(!/^[A-Za-z0-9]*$/.test(name)) {
			$("#msg-username").html(m_global_v.strings['name invalid']);
			$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
			$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
			return;
		}
		if(name.length < 6) {
			$("#msg-username").html(m_global_v.strings['name invalid'] + "," + m_global_v.strings['namelength']);
			$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px -160px transparent");
			$('#register-inputName').css("border-color","rgba(82,168,236,0.8)");	
			return;
		}
		if(name.length > 20) {
			$("#msg-username").html(m_global_v.strings['namelength']);
			$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
			$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
			return;
		}
		$("#msg-username").html("");
		$('#register-check').css("background", "url('images/check.png') no-repeat scroll 0px -200px transparent");
		$('#register-inputName').css("border-color", "rgba(82,168,236,0.8)");
		return;
	},

	socket_io: function() {
		m_global_v.socket.on('register', function(data) {
			if (data.err) {
				m_global_v.showmessage('register-message', data.err, 'error');
			} else {
				m_global_v.showmessage('register-message', 'registerok');
				$('#register-inputName').val('');
				$('#register-inputPassword').val('');
				$('#register-confirmPassword').val('');
			}
			m_global_v.removeloading('register-control');
			m_global_v.registerLock = false;
		});

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
