/*********************Login part*********************/

var LoginControl = can.Control.extend({
	//全局model的引用
	m_global_v: '',
	//初始化函数
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		//ejs模板的渲染		
		this.element.append(can.view("../ejs/login.ejs", {}));
		this.socket_io();
		this.resize();
	},

	///////////////////////////////////////reaction area////////////////////////////////////
	//登录提交
	'#login-submit click': function() {
		this.login();
	},
	//点击登录界面上的注册按钮
	'#login-to-register click': function() {
		this.registerview();
	},
	//keydown事件
	'#login-inputName keydown': function() {
		if (event.keyCode == 13)
			$("#login-inputPassword").focus();
	},
	'#login-inputPassword keydown': function() {
		if (event.keyCode == 13)
			this.login();
	},

	/////////////////////////////////////logic and business/////////////////////////////////
	//客户的登录逻辑	
	login: function() {
		//获取输入框的数据
		var login_name = $('#login-inputName').val();
		var login_pass = $('#login-inputPassword').val();
		//名字输入为空
		if (login_name == '') {
			m_global_v.showmessage('login-message', 'pleaseinput', 'error');
			return;
		}
		//如果登录被加锁，则不进行登录操作
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

	//切换至注册界面
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
	
	//调整dom位置,在初始化时调用
	resize: function() {
		var w = $('#login-box').parent('*').width();
		$('#login-box').css('left', ((w - 420) / 2 - 30) + 'px');
		$('#login-inputName').focus();
	},

	///////////////////////////////////////socket reaction/////////////////////////////////
	//接收到服务器返回消息后处理的业务
	socket_io: function() {
		m_global_v.socket.on('login', function(data) {
			if (data.err) {
				//如果cookie有效期过了
				if (data.err == 'expired') {
					//移除cookie
					$.removeCookie('sid');
				} else {
					m_global_v.showmessage('login-message', data.err, 'error');
				}
			} else {
				//上锁
				m_global_v.operationLock = false;
				//dom元素的设置
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
				//初始化渲染文件列表所需的参数
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

				//清空成员列表
				m_global_v.memberlist.clear();
				//更新成员列表
				m_global_v.memberlist.add(data.user);
			}
			//除去所有加载样式
			m_global_v.cleanloading();
			//login解锁
			m_global_v.loginLock = false;
		});

		//同名用户登录强制下线的响应
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
		
		//用于处理是否第一次登录即自动登录事件
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

		//收到服务器连接成功请求		
		m_global_v.socket.on('connect', function() {
			//发送是否自动登录
			m_global_v.socket.emit('version', {});
		});
	}
});
/****************************************************/

/************************Resgister part***********************/


var RegisterController = can.Control.extend({
	//全局model的引用
	m_global_v: '',
	self: this,
	init: function(element, options) {
		self.m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/register.ejs", {}));
		this.socket_io();
		this.checkusername();
	},

	///////////////////////////////events//////////////////////////
	'#register-submit click': function() {
		this.register();
	},

	'#register-to-login click': function() {
		this.loginview();
	},

	'#register-inputName keydown': function() {
		if (event.keyCode == 13)
			$("#register-inputPassword").focus();
	},
	'#register-inputPassword keydown': function() {
		if (event.keyCode == 13)
			$("#register-confirmPassword").focus();
	},
	'#register-confirmPassword keydown': function() {
		if (event.keyCode == 13)
			this.register();
	},
	'#register-inputName keyup':function() {
		this.checkusername();
	},

	//////////////////////////////logic and business/////////////////////////////////

	//客户的注册逻辑
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
		//向服务器发送注册请求
		m_global_v.socket.emit('register', {
			name: registername,
			password: pass,
			avatar: 'images/character.png'
		});
	},

	//回到登录界面
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
	//判断注册名的格式以及设置对应的样式
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

	///////////////////////////////////////////socket reaction////////////////////////////////////
	socket_io: function() {
		var self = this;
		m_global_v.socket.on('register', function(data) {
			if (data.err) {
				m_global_v.showmessage('register-message', data.err, 'error');
			} else {
				var myself = self;
				m_global_v.showmessage('register-message', 'registerok');
				//自动回到登录界面
				setTimeout(function(){myself.loginview();}, 1000);
				$('#register-inputName').val('');
				$('#register-inputPassword').val('');
				$('#register-confirmPassword').val('');
			}
			m_global_v.removeloading('register-control');
			m_global_v.registerLock = false;
		});
	}
});
