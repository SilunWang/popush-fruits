////////////////////////// vars ///////////////////////////////
var global_v;

var gutterclick;


/////////////////////// Check Browser //////////////////////////

var Browser = {};
var ua = navigator.userAgent.toLowerCase();
var s;
(s = ua.match(/msie ([\d.]+)/)) ? Browser.ie = s[1] :
	(s = ua.match(/firefox\/([\d.]+)/)) ? Browser.firefox = s[1] :
	(s = ua.match(/chrome\/([\d.]+)/)) ? Browser.chrome = s[1] :
	(s = ua.match(/opera.([\d.]+)/)) ? Browser.opera = s[1] :
	(s = ua.match(/version\/([\d.]+).*safari/)) ? Browser.safari = s[1] : 0;

var novoice = false;


////////////////////////Socket//////////////////////
var socket = io.connect(SOCKET_IO);
socket.on('log', function(e){
	console.log(e);
});

var strings = getCookie('fruits-language-selection') == 'fruits-english-selection' ? strings_en : strings_cn;

var myTheme = getCookie('fruits-theme-selection');

/************************************************************************
|    函数名称： getCookie                                                
|    函数功能： 读取cookie函数                                            
|    入口参数： Name：cookie名称   
|	 Author: SilunWang                                         
*************************************************************************/

function getCookie(name) 
{ 
    var search = name + "=" 
    if(document.cookie.length > 0) 
    { 
        offset = document.cookie.indexOf(search) 
        if(offset != -1)
        { 
            offset += search.length 
            end = document.cookie.indexOf(";", offset) 
            if(end == -1) end = document.cookie.length 
            return unescape(document.cookie.substring(offset, end)) 
        } 
        else return "" 
    } 
} 

/********************全局变量Model*********************/
GlobalVariables = can.Model.extend({},{
	self:this,
	init:function(global_data){
		////////////////////////// vars ///////////////////////////////
		this.currentUser = [];
		this.currentDir = [];
		this.currentDirString = '';
		this.dirMode = global_data.g_dirMode;

		this.newfiletype = 'doc';
		this.filelisterror = function(){;};
		this.docshowfilter = function(o){ return true; };
		this.filelist = global_data.g_filelist;

		this.userlist = '';
		this.currentsharedoc = '';

		this.memberlist = '';
		this.memberlistdoc = '';

		this.expressionlist = '';

		this.movehandler = '';

		this.dochandler = '';
		this.doccallback = '';

		this.loadDone = false;
		this.failed = false;

		this.loadings = {};

		this.gutterclick = function(cm, n) {};

		this.firstconnect = true;

		/////////////////////// locks //////////////////////////////////
		this.loginLock = false;
		this.registerLock = false
		this.viewswitchLock = false
		this.operationLock = false;

		////////////////////////Socket//////////////////////
		this.socket = global_data.g_socket;

		///////////////////////language related///////////////////
		this.strings = global_data.g_strings;
		this.strings_en = global_data.g_strings_en;
		this.strings_cn = global_data.g_strings_cn;
		///////////////////////theme related//////////////////////
		this.myTheme = global_data.g_myTheme;

		this.doc_on();
		this.delete_obj = '';
		this.rename_obj = '';
	},
	//获得当前路径的标准路径名
	//拆分成路径的标准格式
	getdirstring: function() {
		//如果是拥有的文件，返回/将currentDir转化为字符串的形式
		//例如["jln","c++file"]就变成了/jln/c++file
		if (this.dirMode == 'owned')
			return '/' + this.currentDir.join('/');
		else {
			//否则，删除currentDir中的第一项，复制给name
			var name = this.currentDir.shift();
			//
			var r = '/' + this.currentDir.join('/');
			if (this.currentDir.length == 0) {
				r = '/' + name;
			}
			this.currentDir.unshift(name);
			return r;
		}
	},
	//获取链接
	getdirlink: function(before) {
		var s = '';
		if (!before) {
			before = '';
		}
		//拆分成link的格式
		for (var i = 0, j = this.currentDir.length - 1; i < this.currentDir.length; i++, j--) {
			var t = this.currentDir[i];
			var p = t.split('/');
			if (p.length > 1)
				t = p[1] + '@' + p[0];
			if (i == 0 && this.dirMode == 'shared')
				s += ' / <a href="javascript:;" onclick="' + before + 'global_v.backto(' + j + ');">shared@' + this.htmlescape(t) + '</a>';
			else
				s += ' / <a href="javascript:;" onclick="' + before + 'global_v.backto(' + j + ');">' + this.htmlescape(t) + '</a>';
		}
		return s;
	},
	htmlescape: function(text) {
		return text.
		replace(/&/gm, '&amp;').
		replace(/</gm, '&lt;').
		replace(/>/gm, '&gt;').
		replace(/ /gm, '&nbsp;').
		replace(/\n/gm, '<br />');
	},
	backto: function(n) {
		if (this.operationLock)
			return;
		this.operationLock = true;
		var temp = [];
		for (var i = 0; i < n; i++) {
			temp.push(this.currentDir.pop());
		}
		this.currentDirString = this.getdirstring();
		this.refreshfilelist(function() {
			for (var i = 0; i < n; i++) {
				this.currentDir.push(temp.pop());
			}
			this.currentDirString = this.getdirstring();
		});
	},
	backtologin: function() {
		$('#big-one .container').removeAttr('style');
		$('#big-one').animate({
			height: '120px',
			padding: '60px',
			'margin-bottom': '30px'
		}, 'fast', function() {
			$('#big-one').removeAttr('style');
			$('#big-one .container').css('margin', 'auto');
			$('#login-inputName').focus();
			resize();
		});
		$('#nav-head').fadeOut('fast');
		$('#filecontrol').hide();
		$('#editor').hide();
		$('#login').fadeIn('fast');
		//SilunWang fix a bug(footer disappear)
		$('#footer').fadeIn('fast');
		$('.modal').modal('hide');
	},

	loading: function(id) {
		if (this.loadings[id])
			return;
		var o = $('#' + id);
		o.after('<p id="' + id + '-loading" align="center" style="margin:1px 0 2px 0"><img src="images/loading.gif"/></p>');
		o.hide();
		this.loadings[id] = {
			self: o,
			loading: $('#' + id + '-loading')
		};
	},

	removeloading: function(id) {
		if (!this.loadings[id])
			return;
		this.loadings[id].self.show();
		this.loadings[id].loading.remove();
		delete this.loadings[id];
	},
	cleanloading: function() {
		for (var k in this.loadings) {
			this.removeloading(k);
		}
	},
	showmessage: function(id, stringid, type) {
		var o = $('#' + id);
		o.removeClass('alert-error');
		o.removeClass('alert-success');
		o.removeClass('alert-info');
		if (type && type != '' && type != 'warning')
			o.addClass('alert-' + type);
		if (strings[stringid])
			$('#' + id + ' span').html(strings[stringid]);
		else
			$('#' + id + ' span').html(stringid);
		o.slideDown();
	},
	showmessageindialog: function(id, stringid, index) {
		if (index === undefined) {
			$('#' + id + ' .control-group').addClass('error');
			if (strings[stringid])
				$('#' + id + ' .help-inline').text(strings[stringid]);
			else
				$('#' + id + ' .help-inline').text(stringid);
		} else {
			$('#' + id + ' .control-group:eq(' + index + ')').addClass('error');
			if (strings[stringid])
				$('#' + id + ' .help-inline:eq(' + index + ')').text(strings[stringid]);
			else
				$('#' + id + ' .help-inline:eq(' + index + ')').text(stringid);
		}
	},

	showmessagebox: function(title, content, timeout) {
		if (strings[title])
			$('#messagedialogLabel').html(strings[title]);
		else
			$('#messagedialogLabel').html(title);
		if (strings[content])
			$('#messagedialogContent').html(strings[content]);
		else
			$('#messagedialogContent').html(content);
		$('#messagedialog').modal('show');
		t = setTimeout('$(\'#messagedialog\').modal(\'hide\');', timeout * 1000);
	},
	loadfailed: function() {
		if (this.loadDone)
			return;
		this.failed = true;
		$('#loading-init').remove();
		this.showmessage('login-message', 'loadfailed');
	},

	pressenter: function(e, func, idUp, idDown) {
		e = e || event;
		if (e.keyCode == 13 && this.loadDone)
			func();
		else if (e.keyCode == 38)
			$('#' + idUp).focus();
		else if (e.keyCode == 40)
			$('#' + idDown).focus();
	},
	refreshfilelist: function(error, callback) {
		this.operationLock = true;
		this.filelist.loading();
		this.dochandler = this.refreshlistdone;
		this.doccallback = callback;
		this.socket.emit('doc', {
			path: this.currentDirString
		});
		this.filelisterror = error;
	},
	refreshlistdone: function(data) {
		this.filelist.removeloading();
		if (data.err) {
			this.filelisterror();
			this.showmessagebox('error', 'failed', 1);
		} else {
			$('#current-dir').html(this.getdirlink());
			if (this.dirMode == 'owned')
				this.filelist.setmode(this.filelist.getmode() | 2);
			else
				this.filelist.setmode(0);
			if (this.currentDir.length == 1) {
				if (this.dirMode == 'owned')
					this.filelist.setmode(this.filelist.getmode() | 1);
				this.filelist.formdocs(data.doc, this.docshowfilter);
				this.memberlist.clear();
				this.memberlist.add(this.currentUser);
			} else {
				this.filelist.setmode(this.filelist.getmode() & ~1);
				this.filelist.formdocs(data.doc.docs, this.docshowfilter, data.doc.members.length > 0, data.doc);
				this.memberlist.fromdoc(data.doc);
				this.memberlistdoc.fromdoc(data.doc);
			}
			if (this.doccallback)
				this.doccallback();
		}
		this.operationLock = false;
	},
	doc_on: function() {
		var self = this;
		this.socket.on('doc', function(data) {
			self.dochandler(data);
		});
	}
});
/****************************************************/


/*********************Login part*********************/


var LoginInformation = can.Model.extend({});

var LoginControl = can.Control.extend({
	m_global_v: '',
	m_login_information: '',
	self: this,
	init: function(element, options) {
		self.m_global_v = this.options.m_global_v;
		self.m_login_information = this.options.m_login_information;
		this.element.append(can.view("../ejs/login.ejs", {
			control_login_information: self.m_login_information
		}));
		this.socket_io();
		this.resize();
	},

	//reaction area
	'#login-submit click': function() {
		self.m_login_information.attr('login_name', $('#login-inputName').val());
		self.m_login_information.attr('login_password', $('#login-inputPassword').val());
		//self.m_login_information.save();
		this.login();
	},

	'#login-to-register click': function() {
		this.registerview();
	},

	//business
	login: function() {
		console.log("a");
		//获取输入框的数据
		var login_name = self.m_login_information.login_name;
		var login_pass = self.m_login_information.login_password;
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
				m_global_v.currentDirString = m_global_v.getdirstring();
				m_global_v.docshowfilter = {
					flag: 1,
					currentDir: m_global_v.currentDir,
					currentUser: m_global_v.currentUser
				}
				//获取当前的link
				$('#current-dir').html(m_global_v.getdirlink());
				//
				m_global_v.filelist.setmode(3);
				m_global_v.filelist.formdocs(data.user.docs, m_global_v.docshowfilter);

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

/*******************fileTabs*************************/
var FileTabsContorl = can.Control.extend({
	m_global_v: '',
	self: this,
	init: function(element, options) {
		self.m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/filetab.ejs", {}));
	},
	'#new-file click': function() {
		$('#newfile-inputName').val('');
		$('#newfile .control-group').removeClass('error');
		$('#newfile .help-inline').text('');
		$('#newfileLabel').text(strings['newfile']);
		m_global_v.newfiletype = 'doc';
	},
	'#new-file-folder click': function() {
		$('#newfile-inputName').val('');
		$('#newfile .control-group').removeClass('error');
		$('#newfile .help-inline').text('');
		$('#newfileLabel').text(strings['newfolder']);
		m_global_v.newfiletype = 'dir';
	},
	'#uploadfile click': function() {
		function handleFileSelect(evt)
		{
			m_global_v.newfiletype = 'doc';
			var files = evt.target.files;
			var reader = new FileReader();
			reader.onloadend = function(evt){
		  		 //console.log(evt.target.result);
		  		var name = files[0].name;
				name = $.trim(name);
				if (name == '') {
					m_global_v.showmessageindialog('newfile', 'inputfilename');
					return;
				}
				if (/\/|\\|@/.test(name)) {
					m_global_v.showmessageindialog('newfile', 'filenameinvalid');
					return;
				}
				if (name.length > 32) {
					m_global_v.showmessageindialog('newfile', 'filenamelength');
					return;
				}
				if (m_global_v.operationLock)
					return;
				m_global_v.operationLock = true;
				m_global_v.loading('newfile-buttons');
				m_global_v.socket.emit('upload', {
					type: m_global_v.newfiletype,
					path: m_global_v.currentDirString + '/' + name,
					content:evt.target.result
				});
			};
			// Read in the image file as a data URL.
		  	reader.readAsText(files[0]);

		}
		var upload = document.createElement('input');
		upload.setAttribute('style', 'display:none');
		upload.setAttribute('type', 'file');
		upload.addEventListener('change', handleFileSelect, false);
		document.body.appendChild(upload);
		upload.click();
		document.body.removeChild(upload);
	},
	'#uploadzip click': function() {
		function handleFileSelect(evt){
			 var files = evt.target.files;
			 var f = files[0];

			  if (f.type === "application/zip") {
			  		var l = f.name.length;
			  		var name = f.name;
			  		if(f.name[l - 1] == 'p' && f.name[l - 2] == 'i' && f.name[l - 3] == 'z' && f.name[l - 4] == '.'){
			  			name = name.substr(0, l - 4);
			  		}
			  		var names = new Array();
			  		var types = new Array();
			  		var contents = new Array();
			  		names.push(m_global_v.currentDirString + '/' + name);
			  		types.push('dir');
			  		contents.push("");
					var reader = new FileReader();
				  	reader.onloadend = function(evt){
				  	var zip = new JSZip(evt.target.result);
				  	$.each(zip.files, function (index, zipEntry){
		            	if(zipEntry.options.dir == true){
		            		names.push(currentDirString + '/' + name + '/' + zipEntry.name.substr(0, zipEntry.name.length - 1));
		            		types.push('dir');
		            		contents.push('');
		           

		            	}else{
		            		names.push(m_global_v.currentDirString + '/' + name + '/' + zipEntry.name);
		            		types.push('doc');
		            		contents.push(zip.file(zipEntry.name).asText());
		            		
		            	}
		          	});
				  	m_global_v.socket.emit('uploadzip', {names:names, contents:contents, types:types});
				  	};
				  	reader.readAsArrayBuffer(f);
		    }
		    else{
		    	m_global_v.showmessagebox('error', 'the file cannot support zip-format', 1);
		    }

		}
		var upload = document.createElement('input');
		upload.setAttribute('style', 'display:none');
		upload.setAttribute('type', 'file');
		upload.addEventListener('change', handleFileSelect, false);
		document.body.appendChild(upload);
		upload.click();
		document.body.removeChild(upload);
	},
	'#newprojectopen click': function() {
		if(m_global_v.currentDirString.split('/').length > 2){
			alert("cannot new project in this dir");
			return false;
		}
		$('#newfile-inputName').val('');
		$('#newfile .control-group').removeClass('error');
		$('#newfile .help-inline').text('');
		$('#newfileLabel').text(strings['newfolder']);
		m_global_v.newfiletype = 'pro';
		return true;
	},
	'#creategitfolder click': function() {
		if(m_global_v.currentDirString.split('/').length > 2){
			alert("cannot new project in this dir");
			return false;
		}
		$('#newfile-inputName').val('');
		$('#newfile .control-group').removeClass('error');
		$('#newfile .help-inline').text('');
		$('#newfileLabel').text(strings['newfolder']);
		m_global_v.newfiletype = 'git';
	},
	'#ownedfileex click': function() {
		if (m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.dirMode = 'owned';
		m_global_v.docshowfilter = {
			flag: 1,
			currentDir: m_global_v.currentDir,
			currentUser: m_global_v.currentUser
		}
		m_global_v.currentDir = [m_global_v.currentUser.name];
		m_global_v.currentDirString = m_global_v.getdirstring();
		m_global_v.docshowfilter = {flag:1,currentDir:m_global_v.currentDir,currentUser:m_global_v.currentUser}
		$('#current-dir').html(m_global_v.getdirlink());
		m_global_v.refreshfilelist(function() {;
		});

		$('#ownedfile').show();
		$('#ownedfileex').hide();
		$('#sharedfile').removeClass('active');
	},
	'#sharedfile click': function() {
		if (m_global_v.dirMode == 'shared')
			return;
		if (m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.dirMode = 'shared';
		m_global_v.docshowfilter = {
			flag: 0,
			currentDir: m_global_v.currentDir,
			currentUser: m_global_v.currentUser
		}
		m_global_v.currentDir = [m_global_v.currentUser.name];
		m_global_v.currentDirString = m_global_v.getdirstring();
		m_global_v.docshowfilter = {flag:0,currentDir:m_global_v.currentDir,currentUser:m_global_v.currentUser}
		$('#current-dir').html(m_global_v.getdirlink());
		m_global_v.refreshfilelist(function() {;
		});

		$('#ownedfile').hide();
		$('#ownedfileex').show();
		$('#sharedfile').addClass('active');
	}
});
/****************************************************/


/*******************New file*************************/
//Control
var NewFileController = can.Control.extend({
	m_global_v: '',
	m_filename: '',
	m_filenameId: '#newfile-inputName',
	init: function(element, options) {
		m_new_file = this.options.m_new_file;
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/newfile.ejs", {
			control_new_file: m_new_file
		}));
		this.socket_io();
		$('#newfile').on('shown', function() {
			$('#newfile-inputName').focus();
		});
	},

	//reaction area
	'#newfile-submit click': function() {
		this.m_filename = $(this.m_filenameId).val();
		this.newfile();
	},

	//business
	newfile: function() {
		var name = $('#newfile-inputName').val();
		if(m_global_v.newfiletype == 'git')
		{
			this.trig_github(name);
		}
		else
		{
			name = $.trim(name);
			if (name == '') {
				m_global_v.showmessageindialog('newfile', 'inputfilename');
				return;
			}
			if (/\/|\\|@/.test(name)) {
				m_global_v.showmessageindialog('newfile', 'filenameinvalid');
				return;
			}
			if (name.length > 32) {
				m_global_v.showmessageindialog('newfile', 'filenamelength');
				return;
			}
			if (m_global_v.operationLock)
				return;
			m_global_v.operationLock = true;
			m_global_v.loading('newfile-buttons');
			if(m_global_v.newfiletype == 'pro')
			{
				name = name + '.pro';
				m_global_v.newfiletype = 'dir';	
			}
		
			m_global_v.socket.emit('new', {
				type: m_global_v.newfiletype,
				path: m_global_v.currentDirString + '/' + name
			});
		}
	},
	trig_github: function(_name) {
		var _github = new Github({
			username: "xu-wang11",
			password: "#wangxu1993"
		});

		var str = 'https://github.com/';
		var n = str.length;
		var github = _name.substr(0, n);
		if (github !== str) {
			alert("you path should start with https://github.com/");
			return;
		}
		var sub = _name.substr(n);
		var array = sub.split('/');
		var username = array[0];
		var reponame = array[1].substr(0, array[1].length - 4);
		var isGit = array[1].substr(array[1].length - 4, 4);
		if (isGit !== ".git") {
			alert("you path should end with .git");
		}
		var repo = _github.getRepo(username, reponame);
		repo.show(function(err, re) {
			if (typeof re === 'undefined') {
				alert('there are no repository');
				return;
			}
			repo.getTree('master?recursive=true', function(err, tree) {
				var names = new Array();
				var types = new Array();
				var contents = new Array();
				var root = m_global_v.currentDirString + '/' + reponame + '.pro' + '/';
				names.push(m_global_v.currentDirString + '/' + reponame + '.pro');
				types.push('dir');
				contents.push("");
				//socket.emit('git', {type:'dir', path:currentDirString + '/' + reponame, content:""});
				var l = tree.length;
				$(".help-inline").html('total:' + l + ',clone:' + 0 + '.');
				for (var i = 0; i < l; i++) {
					var value = tree[i];
					if (value.type === 'blob') {
						var data = repo.contents("master", value.path, function(err, _content) {}, true);
						names.push(root + value.path);
						types.push('doc');
						contents.push(data);
					} else {
						names.push(root + value.path);
						types.push('dir');
						contents.push('');
					}
					$(".help-inline").html('total:' + l + ',clone:' + i + '.');
				}
				m_global_v.socket.emit('git', {
					names: names,
					types: types,
					contents: contents
				});
				$('#newfile').hide();

			});
		});
	},
	socket_io: function() {
		m_global_v.socket.on('new', function(data) {
			if (data.err) {
				m_global_v.showmessageindialog('newfile', data.err);
			}
			else {
				if(data.type=='new')
				{
					$('#newfile').modal('hide');
					if (m_global_v.newfiletype == 'doc')
						m_global_v.showmessagebox('newfile', 'createfilesuccess', 1);
					else
						m_global_v.showmessagebox('newfolder', 'createfoldersuccess', 1);
				}
				else if(data.type == "upload"){
						m_global_v.showmessagebox('upload', 'upload successful', 1);
				}
				else if(data.type=='git'){
					$('#newfile').modal('hide');
					m_global_v.showmessagebox('upload', 'git successful', 1);
				}
			}
			m_global_v.removeloading('newfile-buttons');
			m_global_v.operationLock = false;
			m_global_v.refreshfilelist(function() {;});
		});
	}
});
/****************************************************/


/*********************rename*************************/
var ReNameControl = can.Control.extend({
	m_global_v: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.html(can.view("../ejs/rename.ejs", {}));
		this.socket_io();
	},
	'#rename-ok click': function() {
		this.renamefile();
	},

	renamefile:function(){
		if(m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		var name = $('#rename-inputName').val();
		name = $.trim(name);
		if (name == '') {
			m_global_v.showmessageindialog('rename', 'inputfilename');
			return;
		}
		if (/\/|\\|@/.test(name)) {
			m_global_v.showmessageindialog('rename', 'filenameinvalid');
			return;
		}
		if (name == m_global_v.rename_obj) {
			$('#rename').modal('hide');
			return;
		}
		m_global_v.loading('rename-buttons');
		m_global_v.movehandler = this.renamedone;
		m_global_v.socket.emit('move', {
			path: m_global_v.rename_obj.path,
			newPath: m_global_v.currentDirString + '/' + name
		});
	},

	renamedone: function(data) {
		if (data.err) {
			m_global_v.showmessageindialog('rename', data.err, 0);
			m_global_v.operationLock = false;
		} else {
			$('#rename').modal('hide');
			m_global_v.operationLock = false;
			m_global_v.refreshfilelist(function() {;
			});
		}
		m_global_v.removeloading('rename-buttons');
	},
	socket_io: function() {
		m_global_v.socket.on('move', function(data) {
			m_global_v.movehandler(data);
		});
	}
});
/****************************************************/


/********************deletefile**********************/
var DeleteControl = can.Control.extend({
	m_global_v: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.html(can.view("../ejs/deletefile.ejs", {}));
		this.socket_io();
		this.keydown();
	},


	'#delete-ok click': function() {
		this.deletefile();
	},
	keydown:function(){
		var self = this;
		$("#delete").keydown(function(){
		  m_global_v.pressenter(arguments[0],self.deletefile);
		});
	},
	deletefile: function() {
		if (m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.loading('delete-buttons');
		m_global_v.socket.emit('delete', {
			path: m_global_v.delete_obj.path
		});
	},
	socket_io: function() {
		m_global_v.socket.on('delete', function(data) {
			$('#delete').modal('hide');
			if (data.err) {
				m_global_v.showmessagebox('delete', data.err, 1);
				m_global_v.operationLock = false;
			} else {
				m_global_v.operationLock = false;
				m_global_v.refreshfilelist(function() {;
				});
			}
			m_global_v.removeloading('delete-buttons');
		});
	}
});
/****************************************************/


/*********************Share Files********************/
var ShareController = can.Control.extend({
	m_global_v: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/share.ejs", {}));
		this.socket_io();
		$('#share').on('shown', function() {
			$('#share-inputName').focus();
		});
	},

	//events
	".close-share click": function() {
		if (m_global_v.operationLock)
			return;
		m_global_v.refreshfilelist(function() {;
		});
		$('#share').modal('hide');
	},

	"#share-submit click": function() {
		this.share();
	},
	'#unshare-submit click': function() {
		this.unshare();
	},
	'#share-inputName keydown': function() {
		m_global_v.pressenter(arguments[0], this.share);
	},

	unshare: function() {
		//获取选中的的用户名
		var selected = m_global_v.userlist.getselection();
		//没有选中的话，显示error
		//传入当前的对话框
		if (!selected) {
			m_global_v.showmessage('share-message', 'selectuser', 'error');
			return;
		}
		//如果当前操作被锁了
		//返回
		if (m_global_v.operationLock)
			return;
		//否则，上锁
		m_global_v.operationLock = true;
		m_global_v.loading('share-buttons');
		//向服务器发送取消共享的请求
		m_global_v.socket.emit('unshare', {
			path: m_global_v.currentsharedoc.path,
			name: selected.name
		});
	},

	share: function() {
		var share_name = $('#share-inputName').val();
		if (share_name == '') {
			m_global_v.showmessage('share-message', 'inputusername', 'error');
			return;
		}
		if (m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.loading('share-buttons');
		m_global_v.socket.emit('share', {
			path: m_global_v.currentsharedoc.path,
			name: share_name
		});
	},

	socket_io: function() {
		var self = this;
		m_global_v.socket.on('share', function(data) {
			if (data.err) {
				m_global_v.showmessage('share-message', data.err, 'error');
				m_global_v.operationLock = false;
				m_global_v.removeloading('share-buttons');
			} else {
				m_global_v.dochandler = self.sharedone;
				m_global_v.socket.emit('doc', {
					path: m_global_v.currentsharedoc.path
				});
			}
		});

		m_global_v.socket.on('unshare', function(data) {
			if (data.err) {
				m_global_v.showmessage('share-message', data.err, 'error');
				m_global_v.operationLock = false;
				m_global_v.removeloading('share-buttons');
			} else {
				m_global_v.dochandler = self.sharedone;
				m_global_v.socket.emit('doc', {
					path: m_global_v.currentsharedoc.path
				});
			}
		});
	},
	sharedone: function(data) {
		if (!data.err) {
			m_global_v.userlist.fromusers(data.doc.members);
		}
		$('#share-message').hide();
		m_global_v.removeloading('share-buttons');
		m_global_v.operationLock = false;
	},
});
/****************************************************/


/**********************Filelist**********************/

var FileListController = can.Control.extend({
	m_global_v: '',
	m_object: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/filelist.ejs", {}));
		this.initfilelistevent(m_global_v.filelist);
		$('#rename').on('shown', function() {
			$('#rename-inputName').focus();
		});
	},	
	'#delete-ok click':function(o){
		//if(m_global_v.operationLock)
				//return;
		m_global_v.operationLock = true;
		m_global_v.loading('delete-buttons');
		m_global_v.socket.emit('delete', {
			path: m_object.path
		});
	},
	initfilelistevent: function(fl) {
		var self = this;
		fl.onname = function(o) {
			if (m_global_v.operationLock)
				return;
			if (o.type == 'dir') {
				m_global_v.currentDir.push(o.name);
				m_global_v.currentDirString = m_global_v.getdirstring();
				m_global_v.refreshfilelist(function() {
					m_global_v.currentDir.pop();
					m_global_v.currentDirString = m_global_v.getdirstring();
				});
			}
			/* 
			else if(o.type == 'doc') {
				openeditor(o);
			}*/
		};

		fl.ondelete = function(o) {
			if (o.type == 'dir')
				$('#delete').find('.folder').text(strings['folder']);
			else
				$('#delete').find('.folder').text(strings['file']);
			$('#delete-name').text(o.name);
			$('#delete').modal('show');
			m_global_v.delete_obj = o;
		};

		fl.onrename = function(o) {
			$('#rename-inputName').val(o.name);
			$('#rename .control-group').removeClass('error');
			$('#rename .help-inline').text('');
			$('#rename').modal('show');
			m_global_v.rename_obj = o;
		};

		fl.onshare = function(o) {
			$('#share-name').text(o.name);
			$('#share-inputName').val('');
			$('#share-message').hide();
			m_global_v.userlist.fromusers(o.members);
			$('#share').modal('show');
			m_global_v.currentsharedoc = o;
		};
		fl.ondownload = function(o) {
			m_global_v.socket.emit('download', {
				path: o.path
			});
		};
	}

});
/****************************************************/

var DownloadControl = can.Control.extend({
	m_global_v: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.socket_io();
	},

	//downloadfile: function(data) {

	//},
	socket_io: function() {
		//var self = this;
		m_global_v.socket.on('download', function(data) {
			//self.downloadfile(data);
					function download(filename, text) {
			var pom = document.createElement('a');
			pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
			pom.setAttribute('download', filename);
			pom.click();
		};

		function downloadzip() {
			var zip = new JSZip();
			var files = data.r.result;

			function package(_zip, _files) {
				for (var key in _files) {
					if (typeof _files[key] === "object") {
						var folder = _zip.folder(key);
						package(folder, _files[key]);
					} 
					else if (typeof _files[key] == "string") {
						_zip.file(key, _files[key]);
					}
				}
			};
			package(zip, files);
			var pom = document.createElement('a');
			pom.setAttribute('style', 'display:none');
			document.body.appendChild(pom);
			pom.setAttribute('href', window.URL.createObjectURL(zip.generate({
				type: "blob"
			})));
			pom.setAttribute('download', data.n);
			pom.click();
			document.body.removeChild(pom);
		};
		if (data.r.type == "file") {
			download(data.n, data.r.result);
		} 
		else if (data.r.type == "dir") {
			downloadzip();
		}
		});

		m_global_v.socket.on('uploadzip', function(data) {
			m_global_v.showmessagebox('zip', 'upload finished. Error number:' + data.e, 1);
			m_global_v.refreshfilelist(function() {;
			});
		});
	},
});

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



/************************Footer**********************/
var FooterController = can.Control.extend({
	m_global_v: '',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		//strings: choose language pack initially By SilunWang
		m_global_v.strings = this.getCookie('fruits-language-selection') == 'fruits-english-selection' ? m_global_v.strings_en : m_global_v.strings_cn;
		m_global_v.myTheme = this.getCookie('fruits-theme-selection');
		switch (m_global_v.myTheme) {
			case 'fruits_theme_static':
				this.changeStaticTheme();
				break;
			case 'fruits_theme_1':
				this.changetheme1();
				break;
			case 'fruits_theme_2':
				this.changetheme2();
				break;
			default:
				this.changeStaticTheme();
				break;
		}
		this.element.append(can.view("../ejs/footer.ejs", {}));
	},
	'#changeStaticTheme click': function() {
		this.changeStaticTheme();
	},
	'#changetheme1 click': function() {
		this.changetheme1();
	},
	'#changetheme2 click': function() {
		this.changetheme2();
	},
	'#changeEng click': function() {
		this.changeEng();
	},
	'#changeChn click': function() {
		this.changeChn();
	},
	//更改主题为第一个主题
	changetheme1: function() {
		this.setCookie('fruits-theme-selection', 'fruits_theme_1');
		this.removejscssfile("anotherTheme.css", "css");
		this.loadjscssfile("css/changebootstrap.css", "css");
	},
	changetheme2: function() {
		this.setCookie('fruits-theme-selection', 'fruits_theme_2');
		this.removejscssfile("changebootstrap.css", "css");
		this.loadjscssfile("css/anotherTheme.css", "css");
	},
	changeStaticTheme: function() {
		this.setCookie('fruits-theme-selection', 'fruits_theme_static');
		this.removejscssfile("anotherTheme.css", "css");
		this.removejscssfile("changebootstrap.css", "css");
	},
	//更改语言为English
	changeEng: function() {
		this.setCookie('fruits-language-selection', 'fruits-english-selection');
		m_global_v.strings = m_global_v.strings_en;
		$('[localization]').html(function(index, oldcontent) {
			for (var iter in m_global_v.strings_cn) {
				if (oldcontent == m_global_v.strings_cn[iter])
					return m_global_v.strings_en[iter];
			}
			return oldcontent;
		});
		$('[title]').attr('title', function(index, oldcontent) {
			for (var iter in m_global_v.strings_cn) {
				if (oldcontent == m_global_v.strings_cn[iter])
					return m_global_v.strings_en[iter];
			}
			return oldcontent;
		});
	},
	//更改语言为中文
	changeChn: function() {
		this.setCookie('fruits-language-selection', 'fruits-chinese-selection');
		m_global_v.strings = m_global_v.strings_cn;
		$('[localization]').html(function(index, oldcontent) {
			for (var iter in m_global_v.strings_en) {
				if (oldcontent == m_global_v.strings_en[iter])
					return m_global_v.strings_cn[iter];
			}
			return oldcontent;
		});
		$('[title]').attr('title', function(index, oldcontent) {
			for (var iter in m_global_v.strings_en) {
				if (oldcontent == m_global_v.strings_en[iter])
					return m_global_v.strings_cn[iter];
			}
			return oldcontent;
		});
	},
	setCookie: function(name, value) {
		var argv = this.setCookie.arguments;
		var argc = this.setCookie.arguments.length;
		var expires = (argc > 2) ? argv[2] : null;
		if (expires != null) {
			var LargeExpDate = new Date();
			LargeExpDate.setTime(LargeExpDate.getTime() + (expires * 1000 * 3600 * 24));
		}
		document.cookie = name + "=" + escape(value) + ((expires == null) ? "" : ("; expires=" + LargeExpDate.toGMTString()));
	},
	getCookie: function(name) {
		var search = name + "="
		if (document.cookie.length > 0) {
			offset = document.cookie.indexOf(search)
			if (offset != -1) {
				offset += search.length
				end = document.cookie.indexOf(";", offset)
				if (end == -1) end = document.cookie.length
				return unescape(document.cookie.substring(offset, end))
			} else return ""
		}
	},
	deleteCookie: function(name) {
		var expdate = new Date();
		expdate.setTime(expdate.getTime() - (86400 * 1000 * 1));
		this.setCookie(name, "", expdate);
	},
	loadjscssfile: function(filename, filetype) {
		if (filetype == "js") {
			var fileref = document.createElement('script');
			fileref.setAttribute("type", "text/javascript");
			fileref.setAttribute("src", filename);
		} else if (filetype == "css") {
			var fileref = document.createElement("link");
			fileref.setAttribute("rel", "stylesheet");
			fileref.setAttribute("type", "text/css");
			fileref.setAttribute("href", filename);
		}
		if (typeof fileref != "undefined")
			document.getElementsByTagName("head")[0].appendChild(fileref);
	},
	removejscssfile: function(filename, filetype) {
		var targetelement;
		var targetattr;
		switch (filetype) {
			case 'js':
				targetelement = 'script';
				targetattr = 'src';
				break;
			case 'css':
				targetelement = 'link';
				targetattr = 'href';
				break;
			default:
				break;
		}
		var allsuspects = document.getElementsByTagName(targetelement);
		for (var i = allsuspects.length; i >= 0; i--) {
			if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf(filename) != -1)
				allsuspects[i].parentNode.removeChild(allsuspects[i]);
		}
	}
});
/****************************************************/


 

var languagemap = { 
	'c':		'clike',
	'clj':		'clojure',
	'coffee':	'coffeescript',
	'cpp':		'clike',
	'cs':		'clike',
	'css':		'css',
	'go':		'go',
	'h':		'clike',
	'htm':		'htmlmixed',
	'html':		'htmlmixed',
	'hpp':		'clike',
	'java':		'clike',
	'js':		'javascript',
	'json':		'javascript',
	'lisp':		'commonlisp',
	'lua':		'lua',
	'md':		'markdown',
	'pas':		'pascal',
	'php':		'php',
	'pl':		'perl',
	'py':		'python',
	'rb':		'ruby',
	'sql':		'sql',
	'tex':		'stex',
	'vbs':		'vb',
	'xml':		'xml',
	};

var modemap = {
	'c': 'text/x-csrc',
	'clj': 'text/x-clojure',
	'coffee': 'text/x-coffeescript',
	'cpp': 'text/x-c++src',
	'cs': 'text/x-csharp',
	'css': 'text/css',
	'go': 'text/x-go',
	'h': 'text/x-csrc',
	'htm': 'text/html',
	'html': 'text/html',
	'hpp': 'text/x-c++src',
	'java': 'text/x-java',
	'js': 'text/javascript',
	'json': 'application/json',
	'lisp': 'text/x-common-lisp',
	'lua': 'text/x-lua',
	'md': 'text/x-markdown',
	'pas': 'text/x-pascal',
	'php': 'application/x-httpd-php',
	'pl': 'text/x-perl',
	'py': 'text/x-python',
	'rb': 'text/x-ruby',
	'sql': 'text/x-sql',
	'tex': 'text/x-latex',
	'vbs': 'text/x-vb',
	'xml': 'application/xml',
};



function htmlescape(text) {
	return text.
		replace(/&/gm, '&amp;').
		replace(/</gm, '&lt;').
		replace(/>/gm, '&gt;').
		replace(/ /gm, '&nbsp;').
		replace(/\n/gm, '<br />');
}
/*************************************Editor Initialization Related***************************/

var editor;
//var chatstate = false;
//var oldwidth;

function winHeight() {
	return window.innerHeight || (document.documentElement || document.body).clientHeight;
}

function isFullScreen(cm) {
	return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
}

function setFullScreen(cm, full) {
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
}

function InitEditor(){	
    CodeMirror.on(window, "resize", function() {
		var showing = document.getElementsByClassName("CodeMirror-fullscreen")[0];
		if (!showing) return;
		showing.CodeMirror.getWrapperElement().style.height = winHeight() + "px";
    });

	editor = CodeMirror.fromTextArea($('#editor-textarea').get(0), {
		lineNumbers: true,
		lineWrapping: true,
		indentUnit: 4,
		indentWithTabs: true,
		extraKeys: {
			"Esc": function(cm) {
				if (isFullScreen(cm)) setFullScreen(cm, false);
				resize();
			},
			"Ctrl-S": saveevent
		},
		gutters: ["runat", "CodeMirror-linenumbers", "breakpoints"]
	});
	
	editor.on("gutterClick", function(cm, n) {
		gutterclick(cm, n);
	});
	
	gutterclick = function(cm, n) {};
}

/*************************************Editor Initialization Related***************************/

/*
function togglechat(o) {
	if (viewswitchLock)
		return;
	if (chatstate) {
		$('#editormain').parent().removeClass('span12');
		$('#editormain').parent().addClass('span9');
		$('#chatbox').show();
		$(o).html('<i class="icon-forward"></i>');
		$(o).attr('title', strings['hide-title']);
	} else {
		$('#chatbox').hide();
		$('#editormain').parent().removeClass('span9');
		$('#editormain').parent().addClass('span12');
		$(o).html('<i class="icon-backward"></i>');
		$(o).attr('title', strings['show-title']);
	}
	var o = $('#chat-show').get(0);
	o.scrollTop = o.scrollHeight;
	editor.refresh();
	resize();
	chatstate = !chatstate;
}*/



/////////////////////// initialize ///////////////////////////

$(document).ready(function() {
	//global data
	global_v = new GlobalVariables({
		////////////////////////// vars ///////////////////////////////
		////////////////////////Socket//////////////////////
		g_socket: socket,

		///////////////////////language related///////////////////
		g_strings: strings,
		g_strings_en: strings_en,
		g_strings_cn: strings_cn,
		///////////////////////theme related//////// //////////////
		g_myTheme: myTheme
	});

    	setTimeout('global_v.loadfailed()', 10000);

	//filelist init
	global_v.filelist = fileList('#file-list-table');
	global_v.filelist.clear();

	//userlist init
	global_v.userlist = userList('#share-user-list');
	global_v.userlist.clear();

	//memberlist init	
	global_v.memberlist = userListAvatar('#member-list');
	global_v.memberlistdoc = userListAvatar('#member-list-doc');

	//expressionlist init
	global_v.expressionlist = expressionList('#varlist-table');
	expressionlist = global_v.expressionlist;

	global_v.docshowfilter = {};

	InitEditor();
	registereditorevent();


	///*********************data init area**********************///





	//login
	var login_information = new LoginInformation({
		login_name: '',
		login_password: ''
	});

	///******************data init area end**********************///

	if (!ENABLE_RUN) {
		$('#editor-run').remove();
		if (!ENABLE_DEBUG) {
			$('#editor-console').remove();
		}
	}

	if (!ENABLE_DEBUG) {
		$('#editor-debug').remove();
	}

	$('body').show();
	$('#login-inputName').focus();
	
	if((!Browser.chrome || parseInt(Browser.chrome) < 18) &&
		(!Browser.opera || parseInt(Browser.opera) < 12)) {
		novoice = true;
		$('#voice-on').addClass('disabled');
		$('#voice-on').removeAttr('title');
		$('#voice-on').popover({
			html: true,
			content: strings['novoice'],
			placement: 'left',
			trigger: 'hover',
			container: 'body'
		});
	}

	resize();
	$(window).resize(resize);
	$(window).scroll(function() {
		$('#editormain-inner').css('left', (-$(window).scrollLeft()) + 'px');
	});
	$(window).resize(function() {
		var width = $(document).width() * 0.915;
		var margin_left = (width / 2 - 108) + "px";
		$("#foot-information").css("margin-left", margin_left);
	});
	var footer_control = new FooterController('#footer', {
		m_global_v: global_v
	});
	var file_list_control = new FileListController('#file-list-table', {
		m_global_v: global_v
	});
	var new_file_control = new NewFileController('#newfile', {
		m_global_v: global_v
	});
	var file_tabs_control = new FileTabsContorl('#file-tabs', {
		m_global_v: global_v
	});
	var change_pass_control = new ChangePassControl('#changepassword', {
		m_global_v: global_v
	});
	var change_avatar_control = new ChangeAvatarControl('#changeavatar', {
		m_global_v: global_v
	});
	var nav_head_control = new NavHeadControl('#nav-head', {
		m_global_v: global_v
	});
	var share_control = new ShareController('#share', {
		m_global_v: global_v
	});
	var delete_controller = new DeleteControl('#delete', {
		m_global_v: global_v
	});
	var rename_controller = new ReNameControl('#rename', {
		m_global_v: global_v
	});
	var register_control = new RegisterController('#register', {
		m_global_v: global_v
	});
	var login_control = new LoginControl('#login-box', {
		m_global_v: global_v,
		m_login_information: login_information
	});
	var load_control = new DownloadControl('', {
		m_global_v: global_v
	});

	$('[localization]').html(function(index, old) {
		if (strings[old])
			return strings[old];
		return old;
	});
	$('[title]').attr('title', function(index, old) {
		if (strings[old])
			return strings[old];
		return old;
	});
});
