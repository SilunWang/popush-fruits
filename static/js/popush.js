
////////////////////////// vars ///////////////////////////////
var currentUser;
var currentDir;
var currentDirString;
var dirMode = 'owned';

var newfiletype = 'doc';
var filelisterror = function(){;};
var docshowfilter = function(o){ return true; };
var filelist;

var userlist;
var currentsharedoc;

var memberlist;
var memberlistdoc;

var expressionlist;

var movehandler;

var dochandler;
var doccallback;

var loadDone = false;
var failed = false;

var loadings = {};

var gutterclick;

var firstconnect = true;

/////////////////////// locks //////////////////////////////////
var loginLock = false;
var registerLock = false;
var viewswitchLock = false;
var operationLock = false;

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

//strings: choose language pack initially By SilunWang
var strings = getCookie('fruits-language-selection') == 'fruits-english-selection' ? strings_en : strings_cn;

var myTheme = getCookie('fruits-theme-selection');

switch(myTheme)
{	
	case 'fruits_theme_static':
		changeStaticTheme();
		break;
	case 'fruits_theme_1':
		changetheme1();
		break;
	case 'fruits_theme_2':
		changetheme2();
		break;
	default:
		changeStaticTheme();
		break;
}
//////////////////////// function //////////////////////////////

/************************************************************************
|    函数名称： setCookie                                                
|    函数功能： 设置cookie函数                                            
|    入口参数： name：cookie名称；value：cookie值     
|	 Author: SilunWang              
*************************************************************************/

function setCookie(name, value) 
{
    var argv = setCookie.arguments; 
    var argc = setCookie.arguments.length; 
    var expires = (argc > 2) ? argv[2] : null; 
    if(expires != null)
    { 
        var LargeExpDate = new Date (); 
        LargeExpDate.setTime(LargeExpDate.getTime() + (expires*1000*3600*24));         
    }
    document.cookie = name + "=" + escape (value)+((expires == null) ? "" : ("; expires=" +LargeExpDate.toGMTString())); 
}

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

/************************************************************************
|    函数名称： deleteCookie                                            
|    函数功能： 删除cookie函数                                            
|    入口参数： Name：cookie名称 
|	 Author: SilunWang                                         
*************************************************************************/    

function deleteCookie(name) 
{ 
    var expdate = new Date(); 
    expdate.setTime(expdate.getTime() - (86400 * 1000 * 1)); 
    setCookie(name, "", expdate);
}

//更改语言为English
function changeEng()
{
	setCookie('fruits-language-selection', 'fruits-english-selection');
	strings = strings_en;
	$('[localization]').html(function(index, oldcontent) {
		for(var iter in strings_cn)
		{
			if(oldcontent == strings_cn[iter])
				return strings_en[iter];
		}
		return oldcontent;
	});
	$('[title]').attr('title', function(index, oldcontent) {
		for(var iter in strings_cn)
		{
			if(oldcontent == strings_cn[iter])
				return strings_en[iter];
		}
		return oldcontent;
	});
}

//更改语言为中文
function changeChn()
{
	setCookie('fruits-language-selection', 'fruits-chinese-selection');
	strings = strings_cn;
	$('[localization]').html(function(index, oldcontent) {
		for(var iter in strings_en)
		{
			if(oldcontent == strings_en[iter])
				return strings_cn[iter];
		}
		return oldcontent;
	});
	$('[title]').attr('title', function(index, oldcontent) {
		for(var iter in strings_en)
		{
			if(oldcontent == strings_en[iter])
				return strings_cn[iter];
		}
		return oldcontent;
	});
}

/***************************全局变量Model*********************/
GlobalVariables = can.Model.extend({},{
	init:function(global_data){
		////////////////////////// vars ///////////////////////////////
		this.currentUser = global_data.g_currentUser;
		this.currentDir = global_data.g_currentDir;
		this.currentDirString = global_data.g_currentDirString;
		this.dirMode = global_data.g_dirMode;

		this.newfiletype = global_data.g_newfiletype;
		this.filelisterror = global_data.g_filelisterror;
		this.docshowfilter = global_data.g_docshowfilter;
		this.filelist = global_data.g_filelist;

		this.userlist = global_data.g_userlist;
		this.currentsharedoc = global_data.g_currentsharedoc;

		this.memberlist = global_data.g_memberlist;
		this.memberlistdoc = global_data.g_memberlistdoc;

		this.expressionlist = global_data.g_expressionlist;

		this.movehandler = global_data.g_movehandler;

		this.dochandler = global_data.g_dochandler;
		this.doccallback = global_data.g_doccallback;

		this.loadDone = global_data.g_loadDone;
		this.failed = global_data.g_failed;

		this.loadings = global_data.g_loadings;

		this.gutterclick = global_data.g_gutterclick;

		this.firstconnect = global_data.g_firstconnect;

		/////////////////////// locks //////////////////////////////////
		this.loginLock = global_data.g_loginLock;
		this.registerLock = global_data.g_registerLock;
		this.viewswitchLock = global_data.g_viewswitchLock;
		this.operationLock = global_data.g_operationLock;

		////////////////////////Socket//////////////////////
		this.socket = global_data.g_socket;

		///////////////////////language related///////////////////
		this.strings = global_data.g_strings;

		///////////////////////theme related//////////////////////
		this.myTheme = global_data.g_myTheme;
		
		this.doc_on();
	},
	//获得当前路径的标准路径名
	//拆分成路径的标准格式
	getdirstring:function() {
		//如果是拥有的文件，返回/将currentDir转化为字符串的形式
		//例如["jln","c++file"]就变成了/jln/c++file
		if(this.dirMode == 'owned')
			return '/' + this.currentDir.join('/');
		else {
			//否则，删除currentDir中的第一项，复制给name
			var name = this.currentDir.shift();
			//
			var r = '/' + this.currentDir.join('/');
			if(this.currentDir.length == 0) {
				r = '/' + name;
			}
			this.currentDir.unshift(name);
			return r;
		}
	},
	//获取链接
	getdirlink:function(before) {
		var s = '';
		if(!before) {
			before = '';
		}
		//拆分成link的格式
		for(var i=0, j=this.currentDir.length-1; i<this.currentDir.length; i++, j--) {
			var t = this.currentDir[i];
			var p = t.split('/');
			if(p.length > 1)
				t = p[1] + '@' + p[0];
			if(i == 0 && this.dirMode == 'shared')
				s += ' / <a href="javascript:;" onclick="' + before + 'backto(' + j + ');">shared@' + this.htmlescape(t) + '</a>';
			else
				s += ' / <a href="javascript:;" onclick="' + before + 'backto(' + j + ');">' + this.htmlescape(t) + '</a>';
		}
		return s;
	},
	htmlescape:function(text) {
		return text.
			replace(/&/gm, '&amp;').
			replace(/</gm, '&lt;').
			replace(/>/gm, '&gt;').
			replace(/ /gm, '&nbsp;').
			replace(/\n/gm, '<br />');
	},
	backto:function(n) {
		if(this.operationLock)
			return;
		this.operationLock = true;
		var temp = [];
		for(var i=0; i<n; i++) {
			temp.push(this.currentDir.pop());
		}
		this.currentDirString = this.getdirstring();
		this.refreshfilelist(function() {
			for(var i=0; i<n; i++) {
				this.currentDir.push(temp.pop());
			}
			this.currentDirString = this.getdirstring();
		});
	},
	backtologin:function() {
		$('#big-one .container').removeAttr('style');
		$('#big-one').animate({height:'120px', padding:'60px', 'margin-bottom':'30px'}, 'fast', function() {
			$('#big-one').removeAttr('style');
			$('#big-one .container').css('margin','auto');
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

	loading:function(id) {
		if(this.loadings[id])
			return;
		var o = $('#' + id);
		o.after('<p id="' + id + '-loading" align="center" style="margin:1px 0 2px 0"><img src="images/loading.gif"/></p>');
		o.hide();
		this.loadings[id] = {self: o, loading: $('#' + id + '-loading')};
	},

	removeloading:function(id) {
		if(!this.loadings[id])
			return;
		this.loadings[id].self.show();
		this.loadings[id].loading.remove();
		delete this.loadings[id];
	},
	cleanloading:function() {
		for(var k in loadings) {
			this.removeloading(k);
		}
	},
	showmessage:function(id, stringid, type) {
		var o = $('#' + id);
		o.removeClass('alert-error');
		o.removeClass('alert-success');
		o.removeClass('alert-info');
		if(type && type != '' && type != 'warning')
			o.addClass('alert-' + type);
		if(strings[stringid])
			$('#' + id + ' span').html(strings[stringid]);
		else
			$('#' + id + ' span').html(stringid);
		o.slideDown();
	},
	showmessageindialog:function(id, stringid, index) {
		if(index === undefined) {
			$('#' + id + ' .control-group').addClass('error');
			if(strings[stringid])
				$('#' + id + ' .help-inline').text(strings[stringid]);
			else
				$('#' + id + ' .help-inline').text(stringid);
		} else {
			$('#' + id + ' .control-group:eq('+index+')').addClass('error');
			if(strings[stringid])
				$('#' + id + ' .help-inline:eq('+index+')').text(strings[stringid]);
			else
				$('#' + id + ' .help-inline:eq('+index+')').text(stringid);
		}
	},

	showmessagebox:function(title, content, timeout) {
		if(strings[title])
			$('#messagedialogLabel').html(strings[title]);
		else
			$('#messagedialogLabel').html(title);
		if(strings[content])
			$('#messagedialogContent').html(strings[content]);
		else
			$('#messagedialogContent').html(content);
		$('#messagedialog').modal('show');
		t = setTimeout('$(\'#messagedialog\').modal(\'hide\');', timeout*1000);
	},
	loadfailed:function() {
		if(this.loadDone)
			return;
		this.failed = true;
		$('#loading-init').remove();
		this.showmessage('login-message', 'loadfailed');
	},

	pressenter:function(e, func, idUp, idDown) {
		e = e || event;	
		if(e.keyCode == 13 && this.loadDone)
			func();
		else if(e.keyCode == 38)
			$('#' + idUp).focus();
		else if(e.keyCode == 40)
			$('#' + idDown).focus();
	},

	refreshfilelist:function(error, callback) {
		this.operationLock = true;
		this.filelist.loading();
		this.dochandler = this.refreshlistdone;
		this.doccallback = callback;
		this.socket.emit('doc', {
			path: this.currentDirString
		});
		this.filelisterror = error;
	},
	refreshlistdone:function(data){
		this.filelist.removeloading();
		if(data.err){
			this.filelisterror();
			this.showmessagebox('error', 'failed', 1);
		} else {
			$('#current-dir').html(this.getdirlink());
			if(this.dirMode == 'owned')
				this.filelist.setmode(this.filelist.getmode() | 2);
			else
				this.filelist.setmode(0);
			if(this.currentDir.length == 1) {
				if(this.dirMode == 'owned')
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
			if(this.doccallback)
				this.doccallback();
		}
		this.operationLock = false;
	},
	sharedone:function(data){
		if(!data.err){
			userlist.fromusers(data.doc.members);
		}
		$('#share-message').hide();
		removeloading('share-buttons');
		operationLock = false;
	},
	doc_on:function(){
		var self = this;
		this.socket.on('doc', function(data){
			self.dochandler(data);
		});
	},	

	initfilelistevent:function(fl) {

		fl.onname = function(o) {
			if(this.operationLock)
				return;
			if(o.type == 'dir') {
				this.currentDir.push(o.name);
				this.currentDirString = this.getdirstring();
				this.refreshfilelist(function() {
					this.currentDir.pop();
					this.currentDirString = this.getdirstring();
				});
			}
			/* 
			else if(o.type == 'doc') {
				openeditor(o);
			}*/
		};
	
		fl.ondelete = function(o) {
			if(o.type == 'dir')
				$('#delete').find('.folder').text(strings['folder']);
			else
				$('#delete').find('.folder').text(strings['file']);
			$('#delete-name').text(o.name);
			$('#delete').modal('show');
			deleteconfirm = function() {
				if(operationLock)
					return;
				operationLock = true;
				loading('delete-buttons');
				socket.emit('delete', {
					path: o.path
				});
			};
		};
	
		fl.onrename = function(o) {
			$('#rename-inputName').val(o.name);
			$('#rename .control-group').removeClass('error');
			$('#rename .help-inline').text('');
			$('#rename').modal('show');
			rename = function() {
				var name = $('#rename-inputName').val();
				name = $.trim(name);
				if(name == '') {
					showmessageindialog('rename', 'inputfilename');
					return;
				}
				if(/\/|\\|@/.test(name)) {
					showmessageindialog('rename', 'filenameinvalid');
					return;
				}
				if(name == o.name) {
					$('#rename').modal('hide');
					return;
				}
				if(operationLock)
					return;
				operationLock = true;
				loading('rename-buttons');
				movehandler = renamedone;
				socket.emit('move', {
					path: o.path,
					newPath: currentDirString + '/' + name
				});
			};
		};
	
		fl.onshare = function(o) {
			$('#share-name').text(o.name);
			$('#share-inputName').val('');
			$('#share-message').hide();
			userlist.fromusers(o.members);
			$('#share').modal('show');
			currentsharedoc = o;
		};
	}
});
/***********************************************************/


/***************************Login part**********************/
LoginInformation = can.Model.extend({}, {});

var LoginControl = can.Control.extend({
	m_global_v:'',
	m_login_information: '',
	self: this,
	init: function(element, options) {
		self.m_login_information = this.options.m_login_information;
		self.m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/login.ejs", {
			control_login_information: self.m_login_information
		}));
		this.socket_io();
	},

	//reaction area
	'#login-submit click': function() {
		self.m_login_information.attr('login_name', $('#login-inputName').val());
		self.m_login_information.attr('login_password', $('#login-inputPassword').val());
		//self.m_login_information.save();
		this.login();
	},

	//business
	login: function() {
		console.log("a");
		//获取输入框的数据
		var login_name = self.m_login_information.login_name;
		var login_pass = self.m_login_information.login_password;
		//名字输入为空
		if (login_name == '') {
			showmessage('login-message', 'pleaseinput', 'error');
			return;
		}
		//如果
		if (m_global_v.loginLock)
			return;
		m_global_v.loginLock = true;
		loading('login-control');
		//socket请求，发送用户名和密码，待服务器端接收。
		m_global_v.socket.emit('login', {
			name: login_name,
			password: login_pass
		});
	},
	socket_io:function(){
		m_global_v.socket.on('login', function(data){
		if(data.err){
			//如果cookie期满了
			if(data.err == 'expired') {
				//移除cookie
				$.removeCookie('sid');
			} else {
				showmessage('login-message', data.err, 'error');
			}
		}
		else{
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
			$('#big-one').animate({height:'40px', padding:'0', 'margin-bottom':'20px'}, 'fast');
			$('#nav-head').fadeIn('fast');
			$('#login').hide();
			$('#editor').hide();
			$('#filecontrol').fadeIn('fast');
			$('#nav-user-name').text(data.user.name);
			$('#nav-avatar').attr('src', data.user.avatar);
			m_global_v.currentUser = data.user;
			//向cookie写入sid
			$.cookie('sid', data.sid, {expires:7});
			//当前的路径模式改为拥有的文件
			m_global_v.dirMode = 'owned';
			m_global_v.docshowfilter = m_global_v.allselffilter;
			//currenDir修改为当前user的name
			m_global_v.currentDir = [data.user.name];
			m_global_v.currentDirString = m_global_v.getdirstring();
			//获取当前的link
			$('#current-dir').html(m_global_v.getdirlink());
			//
			m_global_v.filelist.setmode(3);
			m_global_v.filelist.formdocs(data.user.docs, m_global_v.docshowfilter);
		
			m_global_v.memberlist.clear();
			m_global_v.memberlist.add(data.user);
		}
		cleanloading();
		m_global_v.loginLock = false;
	});}
});
/****************************************************/


/*******************fileTabs*************************/
var FileTabsContorl = can.Control.extend({
	m_global_v:'',
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
	'#ownedfileex click': function() {
		if(m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.dirMode = 'owned';
		m_global_v.docshowfilter = m_global_v.allselffilter;
		m_global_v.currentDir = [m_global_v.currentUser.name];
		m_global_v.currentDirString = m_global_v.getdirstring();
		$('#current-dir').html(m_global_v.getdirlink());
		m_global_v.refreshfilelist(function(){;});

		$('#ownedfile').show();
		$('#ownedfileex').hide();
		$('#sharedfile').removeClass('active');
	},
	'#sharedfile click': function() {
		if(m_global_v.dirMode == 'shared')
			return;
		if(m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.dirMode = 'shared';
		m_global_v.docshowfilter = m_global_v.allsharefilter;
		m_global_v.currentDir = [m_global_v.currentUser.name];
		m_global_v.currentDirString = m_global_v.getdirstring();
		$('#current-dir').html(m_global_v.getdirlink());
		m_global_v.refreshfilelist(function(){;});
		
		$('#ownedfile').hide();
		$('#ownedfileex').show();
		$('#sharedfile').addClass('active');
	}
});

/****************************************************/


/*******************New file*************************/
//Control
var NewFileController = can.Control.extend({
	m_global_v:'',
	m_filename:'',
	m_filenameId:'#newfile-inputName',
	init: function(element, options) {
		m_new_file = this.options.m_new_file;
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/newfile.ejs", {
			control_new_file: m_new_file
		}));
		this.socket_io();
	},

	//reaction area
	'#newfile-submit click':function(){
		this.m_filename = $(this.m_filenameId).val();
		this.newfile();
	},

	//business
	newfile:function(){
		var filename = this.m_filename;
		filename = $.trim(filename);
		if(filename == '') {
			showmessageindialog('newfile', 'inputfilename');
			return;
		}
		if(/\/|\\|@/.test(filename)) {
			showmessageindialog('newfile', 'filenameinvalid');
			return;
		}
		if(filename.length > 32) {
			showmessageindialog('newfile', 'filenamelength');
			return;
		}
		m_global_v.operationLock = false;
		if(m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		loading('newfile-buttons');
		m_global_v.socket.emit('new', {
			type: m_global_v.newfiletype,
			path: m_global_v.currentDirString + '/' + filename
		});
	},
	socket_io:function(){
		m_global_v.socket.on('new', function(data){
			if(data.err){
				m_global_v.showmessageindialog('newfile', data.err);
			} else {
				$('#newfile').modal('hide');
				if(newfiletype == 'doc')
					m_global_v.showmessagebox('newfile', 'createfilesuccess', 1);
				else
					m_global_v.showmessagebox('newfolder', 'createfoldersuccess', 1);
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
	m_global_v:'',
	m_object:'',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_object = this.options.m_object;
		this.element.append(can.view("../ejs/rename.ejs", {}));
		this.socket_io();
	},
	'#rename-ok click':function(){
		var name = $('#rename-inputName').val();
		name = $.trim(name);
		if(name == '') {
			m_global_v.showmessageindialog('rename', 'inputfilename');
			return;
		}
		if(/\/|\\|@/.test(name)) {
			m_global_v.showmessageindialog('rename', 'filenameinvalid');
			return;
		}
		if(name == this.m_object.name) {
			$('#rename').modal('hide');
			return;
		}
		if(m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.loading('rename-buttons');
		m_global_v.movehandler = this.renamedone;
		m_global_v.socket.emit('move', {
			path: this.m_object.path,
			newPath: m_global_v.currentDirString + '/' + name
		});
	},
	renamedone: function(data) {
		if(data.err){
			m_global_v.showmessageindialog('rename', data.err, 0);
			m_global_v.operationLock = false;
		} else {
			$('#rename').modal('hide');
			m_global_v.operationLock = false;
			m_global_v.refreshfilelist(function() {;});
		}
		m_global_v.removeloading('rename-buttons');
	},
	socket_io:function(){
		socket.on('move', function(data){
			m_global_v.movehandler(data);
		});
	}
});
/****************************************************/


/********************deletefile**********************/
var DeleteControl = can.Control.extend({
	m_global_v:'',
	m_object:'',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_object = this.options.m_object;
		this.element.append(can.view("../ejs/deletefile.ejs", {}));
	},
	'#delete-ok click':function(){
		if(m_global_v.operationLock)
				return;
		m_global_v.operationLock = true;
		m_global_v.loading('delete-buttons');
		m_global_v.socket.emit('delete', {
			path: this.m_object.path
		});
	},
});
/****************************************************/


/**********************navhead***********************/
var Nav_HeadControl = can.Control.extend({
	m_global_v:'',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/navhead.ejs", {}));
	},
	'#changepasswordopen click':function(){
		$('#changepassword-old').val('');
		$('#changepassword-new').val('');
		$('#changepassword-confirm').val('');
		$('#changepassword .control-group').removeClass('error');
		$('#changepassword .help-inline').text('');
	},
	'#changeavataropen click':function(){
		$('#changeavatar-message').hide();
		$('#changeavatar-img').attr('src', m_global_v.currentUser.avatar);
	},
	'#logout click':function(){
		m_global_v.socket.emit('logout', {
		});
		$.removeCookie('sid');
		m_global_v.backtologin();
	},
});
/****************************************************/


/******************changepassword********************/
var ChangePassControl = can.Control.extend({
	m_global_v:'',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/changepass.ejs", {}));
	},
	'#changepass-ok click':function(){
		var old = $('#changepassword-old').val();
		var pass = $('#changepassword-new').val();
		var confirm = $('#changepassword-confirm').val();
		$('#changepassword .control-group').removeClass('error');
		$('#changepassword .help-inline').text('');
		if(pass != confirm) {
			m_global_v.showmessageindialog('changepassword', 'doesntmatch', 2);
			return;
		}
		if(m_global_v.operationLock)
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


/******************changeavatar********************/
var ChangeAvatarControl = can.Control.extend({
	m_global_v:'',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/changeavatar.ejs", {}));
	},
	'#changeavatar-input change': function() {
		this.changeavatar($('#changeavatar-input')[0]);
	},
	changeavatar: function(o) {
		if(o.files.length < 0) {
			m_global_v.showmessage('changeavatar-message', 'selectuser', 'error');
			return;
		}
		if(m_global_v.operationLock)
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
				if(t.length > 0x100000) {
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
});
/****************************************************/


/*********************Share Files********************/

var ShareController = can.Control.extend({
	m_global_v:'',
	init: function(element, options) {
		m_new_file = this.options.m_new_file;
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/share.ejs", {
			control_new_file: m_new_file
		}));
		this.socket_io();
	},

	//events
	".close-share click":function(){
		if(m_global_v.operationLock)
			return;
		m_global_v.refreshfilelist(function(){;});
		$('#share').modal('hide');
	},
	
	"#share-submit click":function(){
		this.share();
	},
	'#unshare-submit click':function(){
		this.unshare();
	},
	'#share-inputName keydown':function(){
		m_global_v.pressenter(arguments[0],this.share);
	},

	unshare:function(){
		//获取选中的的用户名
		var selected = m_global_v.userlist.getselection();
		//没有选中的话，显示error
		//传入当前的对话框
		if(!selected) {
			m_global_v.showmessage('share-message', 'selectuser', 'error');
			return;
		}
		//如果当前操作被锁了
		//返回
		if(m_global_v.operationLock)
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

	share:function(){
		var share_name = $('#share-inputName').val();
		if(share_name == '') {
			m_global_v.showmessage('share-message', 'inputusername', 'error');
			return;
		}
		if(m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.loading('share-buttons');
		m_global_v.socket.emit('share', {
			path: m_global_v.currentsharedoc.path,
			name: share_name
		});
	},

	socket_io:function(){
		m_global_v.socket.on('share', function(data){
			if(data.err){
				m_global_v.showmessage('share-message', data.err, 'error');
				m_global_v.operationLock = false;
				m_global_v.removeloading('share-buttons');
			} else {
				m_global_v.dochandler = m_global_v.sharedone;
				m_global_v.socket.emit('doc', {
					path: m_global_v.currentsharedoc.path
				});
			}
		});

		m_global_v.socket.on('unshare', function(data){
			if(data.err){
				m_global_v.showmessage('share-message', data.err, 'error');
				m_global_v.operationLock = false;
				m_global_v.removeloading('share-buttons');
			} else {
				m_global_v.dochandler = m_global_v.sharedone;
				m_global_v.socket.emit('doc', {
					path: m_global_v.currentsharedoc.path
				});
			}
		});
	}
});

/*********************************************************************/


/***********************test*************************/
Lala = can.Construct.extend({
},
{
	init:function(haha){
		this.Glele = haha.lela;
	},
	print:function(){
		this.Glele = "a";
		console.log(this.Glele);	
	}	
});
var lela = "bbbbbb";
var lala = new Lala({lela:lela});
lala.print();
lala.lela = "a";
console.log(lela);
/****************************************************/

//更改主题为第一个主题
function changetheme1(){
	setCookie('fruits-theme-selection', 'fruits_theme_1');
	removejscssfile("anotherTheme.css", "css");
	loadjscssfile("css/changebootstrap.css", "css");
}

function changetheme2(){
	setCookie('fruits-theme-selection', 'fruits_theme_2');
	removejscssfile("changebootstrap.css", "css");
	loadjscssfile("css/anotherTheme.css", "css");
}
function changeStaticTheme(){
	setCookie('fruits-theme-selection', 'fruits_theme_static');
	removejscssfile("anotherTheme.css", "css");
	removejscssfile("changebootstrap.css", "css");
}

function loading(id) {
	if(loadings[id])
		return;
	var o = $('#' + id);
	o.after('<p id="' + id + '-loading" align="center" style="margin:1px 0 2px 0"><img src="images/loading.gif"/></p>');
	o.hide();
	loadings[id] = {self: o, loading: $('#' + id + '-loading')};
}

function removeloading(id) {
	if(!loadings[id])
		return;
	loadings[id].self.show();
	loadings[id].loading.remove();
	delete loadings[id];
}

function cleanloading() {
	for(var k in loadings) {
		removeloading(k);
	}
}

function showmessage(id, stringid, type) {
	var o = $('#' + id);
	o.removeClass('alert-error');
	o.removeClass('alert-success');
	o.removeClass('alert-info');
	if(type && type != '' && type != 'warning')
		o.addClass('alert-' + type);
	if(strings[stringid])
		$('#' + id + ' span').html(strings[stringid]);
	else
		$('#' + id + ' span').html(stringid);
	o.slideDown();
}

function showmessageindialog(id, stringid, index) {
	if(index === undefined) {
		$('#' + id + ' .control-group').addClass('error');
		if(strings[stringid])
			$('#' + id + ' .help-inline').text(strings[stringid]);
		else
			$('#' + id + ' .help-inline').text(stringid);
	} else {
		$('#' + id + ' .control-group:eq('+index+')').addClass('error');
		if(strings[stringid])
			$('#' + id + ' .help-inline:eq('+index+')').text(strings[stringid]);
		else
			$('#' + id + ' .help-inline:eq('+index+')').text(stringid);
	}
}

function showmessagebox(title, content, timeout) {
	if(strings[title])
		$('#messagedialogLabel').html(strings[title]);
	else
		$('#messagedialogLabel').html(title);
	if(strings[content])
		$('#messagedialogContent').html(strings[content]);
	else
		$('#messagedialogContent').html(content);
	$('#messagedialog').modal('show');
	t = setTimeout('$(\'#messagedialog\').modal(\'hide\');', timeout*1000);
}
function loadfailed() {
	if(loadDone)
		return;
	failed = true;
	$('#loading-init').remove();
	showmessage('login-message', 'loadfailed');
}


function pressenter(e, func, idUp, idDown) {
	e = e || event;	
	if(e.keyCode == 13 && loadDone)
		func();
	else if(e.keyCode == 38)
		$('#' + idUp).focus();
	else if(e.keyCode == 40)
		$('#' + idDown).focus();
}

function checkusername() {
	var name = $('#register-inputName').val();
	if(name.length == "") {
		$("#msg-username").html(strings['name invalid'] + "," + strings['namelength']);
		$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px -160px transparent");
		$('#register-inputName').css("border-color","rgba(82,168,236,0.8)");	
		return;
	}
	if(!/^[A-Za-z0-9]*$/.test(name)) {
		$("#msg-username").html(strings['name invalid']);
		$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
		$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
		return;
	}
	if(name.length < 6) {
		$("#msg-username").html(strings['name invalid'] + "," + strings['namelength']);
		$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px -160px transparent");
		$('#register-inputName').css("border-color","rgba(82,168,236,0.8)");	
		return;
	}
	if(name.length > 20) {
		$("#msg-username").html(strings['namelength']);
		$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
		$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
		return;
	}
	$("#msg-username").html("");
	$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px -200px transparent");
	$('#register-inputName').css("border-color","rgba(82,168,236,0.8)");
	return;
}


function getdirstring() {
	if(dirMode == 'owned')
		return '/' + currentDir.join('/');
	else {
		var name = currentDir.shift();
		var r = '/' + currentDir.join('/');
		if(currentDir.length == 0) {
			r = '/' + name;
		}
		currentDir.unshift(name);
		return r;
	}
}

function getdirlink(before) {
	var s = '';
	if(!before) {
		before = '';
	}
	for(var i=0, j=currentDir.length-1; i<currentDir.length; i++, j--) {
		var t = currentDir[i];
		var p = t.split('/');
		if(p.length > 1)
			t = p[1] + '@' + p[0];
		if(i == 0 && dirMode == 'shared')
			s += ' / <a href="javascript:;" onclick="' + before + 'backto(' + j + ');">shared@' + htmlescape(t) + '</a>';
		else
			s += ' / <a href="javascript:;" onclick="' + before + 'backto(' + j + ');">' + htmlescape(t) + '</a>';
	}
	return s;
}

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
	'c':		'text/x-csrc',
	'clj':		'text/x-clojure',
	'coffee':	'text/x-coffeescript',
	'cpp':		'text/x-c++src',
	'cs':		'text/x-csharp',
	'css':		'text/css',
	'go':		'text/x-go',
	'h':		'text/x-csrc',
	'htm':		'text/html',
	'html':		'text/html',
	'hpp':		'text/x-c++src',
	'java':		'text/x-java',
	'js':		'text/javascript',
	'json':		'application/json',
	'lisp':		'text/x-common-lisp',
	'lua':		'text/x-lua',
	'md':		'text/x-markdown',
	'pas':		'text/x-pascal',
	'php':		'application/x-httpd-php',
	'pl':		'text/x-perl',
	'py':		'text/x-python',
	'rb':		'text/x-ruby',
	'sql':		'text/x-sql',
	'tex':		'text/x-latex',
	'vbs':		'text/x-vb',
	'xml':		'application/xml',
	};

function changelanguage(language) {
	if(languagemap[language]) {
		if(modemap[language])
			editor.setOption('mode', modemap[language]);
		else
			editor.setOption('mode', languagemap[language]);
		CodeMirror.autoLoadMode(editor, languagemap[language]);
	} else {
		editor.setOption('mode', 'text/plain');
		CodeMirror.autoLoadMode(editor, '');
	}
}

function isFullScreen(cm) {
	return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
}

function winHeight() {
	return window.innerHeight || (document.documentElement || document.body).clientHeight;
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

function allselffilter(o) {
	return currentDir.length > 1 || o.owner.name == currentUser.name;
}

function allsharefilter(o) {
	return currentDir.length > 1 || o.owner.name != currentUser.name;
}

function htmlescape(text) {
	return text.
		replace(/&/gm, '&amp;').
		replace(/</gm, '&lt;').
		replace(/>/gm, '&gt;').
		replace(/ /gm, '&nbsp;').
		replace(/\n/gm, '<br />');
}

function backtologin() {
	$('#big-one .container').removeAttr('style');
	$('#big-one').animate({height:'120px', padding:'60px', 'margin-bottom':'30px'}, 'fast', function() {
		$('#big-one').removeAttr('style');
		$('#big-one .container').css('margin','auto');
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
}

///////////////////// websocket & callback //////////////////////


socket.on('unauthorized', function(){
	backtologin();
	showmessage('login-message', 'needrelogin', 'error');

	if(!window.joinedARoom){
		return;
	}
	window.joinedARoom = false;
	window.voiceConnection.myLocalStream.stop();
	window.voiceConnection.leave();
	while(window.userArray.length > 0){
		$(window.audioArray[window.userArray.shift()]).remove();
	}
	delete window.voiceConnection;
});

socket.on('version', function(data){
	if(data.version != VERSION) {
		location.reload('Refresh');
	}
	if(failed)
		return;
	if(!firstconnect) {
		backtologin();
	}
	firstconnect = false;
	$('#loading-init').remove();
	cleanloading();
	if($.cookie('sid')){
		socket.emit('relogin', {sid:$.cookie('sid')});
		loading('login-control');
		loginLock = true;
	} else {
		$('#login-control').fadeIn('fast');
	}
	loadDone = true;
});

socket.on('connect', function(){
	socket.emit('version', {
	});
});

socket.on('register', function(data){
	if(data.err){
		showmessage('register-message', data.err, 'error');
	}else{
		showmessage('register-message', 'registerok');
		$('#register-inputName').val('');
		$('#register-inputPassword').val('');
		$('#register-confirmPassword').val('');
	}
	removeloading('register-control');
	registerLock = false;
});

function refreshlistdone(data){
	filelist.removeloading();
	if(data.err){
		filelisterror();
		showmessagebox('error', 'failed', 1);
	} else {
		$('#current-dir').html(getdirlink());
		if(dirMode == 'owned')
			filelist.setmode(filelist.getmode() | 2);
		else
			filelist.setmode(0);
		if(currentDir.length == 1) {
			if(dirMode == 'owned')
				filelist.setmode(filelist.getmode() | 1);
			filelist.formdocs(data.doc, docshowfilter);
			memberlist.clear();
			memberlist.add(currentUser);
		} else {
			filelist.setmode(filelist.getmode() & ~1);
			filelist.formdocs(data.doc.docs, docshowfilter, data.doc.members.length > 0, data.doc);
			memberlist.fromdoc(data.doc);
			memberlistdoc.fromdoc(data.doc);
		}
		if(doccallback)
			doccallback();
	}
	operationLock = false;
}

function sharedone(data){
	if(!data.err){
		userlist.fromusers(data.doc.members);
	}
	$('#share-message').hide();
	removeloading('share-buttons');
	operationLock = false;
}

/*
socket.on('new', function(data){
	if(data.err){
		showmessageindialog('newfile', data.err);
	} else {
		$('#newfile').modal('hide');
		if(newfiletype == 'doc')
			showmessagebox('newfile', 'createfilesuccess', 1);
		else
			showmessagebox('newfolder', 'createfoldersuccess', 1);
	}
	removeloading('newfile-buttons');
	operationLock = false;
	refreshfilelist(function() {;});
});*/

socket.on('password', function(data){
	if(data.err){
		showmessageindialog('changepassword', data.err, 0);
	} else {
		$('#changepassword').modal('hide');
		showmessagebox('changepassword', 'changepassworddone', 1);
	}
	removeloading('changepassword-buttons');
	operationLock = false;
});

socket.on('delete', function(data){
	$('#delete').modal('hide');
	if(data.err){
		showmessagebox('delete', data.err, 1);
		operationLock = false;
	} else {
		operationLock = false;
		refreshfilelist(function() {;});
	}
	removeloading('delete-buttons');
});

socket.on('share', function(data){
	if(data.err){
		showmessage('share-message', data.err, 'error');
		operationLock = false;
		removeloading('share-buttons');
	} else {
		dochandler = sharedone;
		socket.emit('doc', {
			path: currentsharedoc.path
		});
	}
});

socket.on('unshare', function(data){
	if(data.err){
		showmessage('share-message', data.err, 'error');
		operationLock = false;
		removeloading('share-buttons');
	} else {
		dochandler = sharedone;
		socket.emit('doc', {
			path: currentsharedoc.path
		});
	}
});

socket.on('avatar', function(data){
	if(data.err){
		showmessage('changeavatar-message', data.err, 'error');
	} else {
		currentUser.avatar = data.url;
		$('#nav-avatar').attr('src', currentUser.avatar);
		$('#changeavatar-img').attr('src', currentUser.avatar);
		$('img.user-' + currentUser.name).attr('src', currentUser.avatar);
		memberlist.refreshpopover(currentUser);
		memberlistdoc.refreshpopover(currentUser);
		showmessage('changeavatar-message', 'changeavatarok');
	}
	operationLock = false;
});

////////////////////// click event //////////////////////////////

function loginview() {
	if(viewswitchLock)
		return;
	viewswitchLock = true;
	$('#register .blink').fadeOut('fast');
	$('#register-message').slideUp();
	$('#register-padding').fadeOut('fast', function(){
		$('#login').show();
		$('#login .blink').fadeIn('fast');
		$('#register').hide();
		$('#login-inputName').val('');
		$('#login-inputPassword').val('');
		$('#login-message').hide();
		$('#login-padding').slideUp('fast', function(){
			$('#login-inputName').focus();
			viewswitchLock = false;
		});
		resize();
	});
}

function registerview() {
	if(viewswitchLock)
		return;
	viewswitchLock = true;
	$('#login .blink').fadeOut('fast');
	$('#login-message').slideUp();
	$('#login-padding').slideDown('fast', function(){
		$('#register').show();
		$('#register .blink').fadeIn('fast');
		$('#login').hide();
		$('#register-inputName').val('');
		$('#register-inputPassword').val('');
		$('#register-confirmPassword').val('');
		$('#register-message').hide();
		$('#register-padding').fadeIn('fast', function(){
			$('#register-inputName').focus();
			viewswitchLock = false;
		});
		resize();
	});
}

function register() {
	var name = $('#register-inputName').val();
	var pass = $('#register-inputPassword').val();
	var confirm = $('#register-confirmPassword').val();
	if(!/^[A-Za-z0-9]*$/.test(name)) {
		showmessage('register-message', 'name invalid');
		return;
	}
	if(name.length < 6 || name.length > 20) {
		showmessage('register-message', 'namelength');
		return;
	}
	if(pass.length > 32){
		showmessage('register-message', 'passlength');
		return;
	}
	if(pass != confirm) {
		showmessage('register-message', 'doesntmatch');
		return;
	}
	if(registerLock)
		return;
	registerLock = true;
	loading('register-control');
	socket.emit('register', {
		name:name,
		password:pass,
		avatar:'images/character.png'
	});
}


//****************************new file canjs**********************//
function newfile() {
	var name = $('#newfile-inputName').val();
	name = $.trim(name);
	if(name == '') {
		showmessageindialog('newfile', 'inputfilename');
		return;
	}
	if(/\/|\\|@/.test(name)) {
		showmessageindialog('newfile', 'filenameinvalid');
		return;
	}
	if(name.length > 32) {
		showmessageindialog('newfile', 'filenamelength');
		return;
	}
	if(operationLock)
		return;
	operationLock = true;
	loading('newfile-buttons');
	socket.emit('new', {
		type: newfiletype,
		path: currentDirString + '/' + name
	});
}

var editor;
var chatstate = false;
var oldwidth;

function togglechat(o) {
	if(viewswitchLock)
		return;
	if(chatstate) {
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
}

function refreshfilelist(error, callback) {
	operationLock = true;
	filelist.loading();
	dochandler = refreshlistdone;
	doccallback = callback;
	socket.emit('doc', {
		path: currentDirString
	});
	filelisterror = error;
}

var deleteconfirm = function(){;};

var rename = function(){;};

function share(){
	var name = $('#share-inputName').val();
	if(name == '') {
		showmessage('share-message', 'inputusername', 'error');
		return;
	}
	if(operationLock)
		return;
	operationLock = true;
	loading('share-buttons');
	socket.emit('share', {
		path: currentsharedoc.path,
		name: name
	});
}

function unshare() {
	var selected = userlist.getselection();
	if(!selected) {
		showmessage('share-message', 'selectuser', 'error');
		return;
	}
	if(operationLock)
		return;
	operationLock = true;
	loading('share-buttons');
	socket.emit('unshare', {
		path: currentsharedoc.path,
		name: selected.name
	});
}

function closeshare() {
	if(operationLock)
		return;
	refreshfilelist(function(){;});
	$('#share').modal('hide');
}


function initfilelistevent(fl) {

	fl.onname = function(o) {
		if(operationLock)
			return;
		if(o.type == 'dir') {
			currentDir.push(o.name);
			currentDirString = getdirstring();
			refreshfilelist(function() {
				currentDir.pop();
				currentDirString = getdirstring();
			});
		} else if(o.type == 'doc') {
			openeditor(o);
		}
	};
	
	fl.ondelete = function(o) {
		if(o.type == 'dir')
			$('#delete').find('.folder').text(strings['folder']);
		else
			$('#delete').find('.folder').text(strings['file']);
		$('#delete-name').text(o.name);
		$('#delete').modal('show');
		deleteconfirm = function() {
			if(operationLock)
				return;
			operationLock = true;
			loading('delete-buttons');
			socket.emit('delete', {
				path: o.path
			});
		};
	};
	
	fl.onrename = function(o) {
		$('#rename-inputName').val(o.name);
		$('#rename .control-group').removeClass('error');
		$('#rename .help-inline').text('');
		$('#rename').modal('show');
		rename = function() {
			var name = $('#rename-inputName').val();
			name = $.trim(name);
			if(name == '') {
				showmessageindialog('rename', 'inputfilename');
				return;
			}
			if(/\/|\\|@/.test(name)) {
				showmessageindialog('rename', 'filenameinvalid');
				return;
			}
			if(name == o.name) {
				$('#rename').modal('hide');
				return;
			}
			if(operationLock)
				return;
			operationLock = true;
			loading('rename-buttons');
			movehandler = renamedone;
			socket.emit('move', {
				path: o.path,
				newPath: currentDirString + '/' + name
			});
		};
	};
	
	fl.onshare = function(o) {
		$('#share-name').text(o.name);
		$('#share-inputName').val('');
		$('#share-message').hide();
		userlist.fromusers(o.members);
		$('#share').modal('show');
		currentsharedoc = o;
	};
}

function backto(n) {
	if(operationLock)
		return;
	operationLock = true;
	var temp = [];
	for(var i=0; i<n; i++) {
		temp.push(currentDir.pop());
	}
	currentDirString = getdirstring();
	refreshfilelist(function() {
		for(var i=0; i<n; i++) {
			currentDir.push(temp.pop());
		}
		currentDirString = getdirstring();
	});
}

/////////////////////// initialize ///////////////////////////

$(document).ready(function() {
    setTimeout('loadfailed()', 10000);

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
	
	registereditorevent();

	filelist = fileList('#file-list-table');
	filelist.clear();
	initfilelistevent(filelist);
	
	userlist = userList('#share-user-list');
	userlist.clear();
	
	memberlist = userListAvatar('#member-list');
	memberlistdoc = userListAvatar('#member-list-doc');
	
	expressionlist = expressionList('#varlist-table');
	
	docshowfilter = allselffilter;

	$('#newfile').on('shown', function() {
		$('#newfile-inputName').focus();
	});

	$('#changepassword').on('shown', function() {
		$('#changepassword-old').focus();
	});

	$('#rename').on('shown', function() {
		$('#rename-inputName').focus();
	});

	$('#share').on('shown', function() {
		$('#share-inputName').focus();
	});

	///*********************data init area**********************///
	
	//global data
	var global_v = new GlobalVariables({
		////////////////////////// vars ///////////////////////////////
		g_currentUser:currentUser,
		g_currentDir:currentDir,
		g_currentDirString:currentDirString,
		g_dirMode:dirMode,

		g_newfiletype:newfiletype,
		g_filelisterror:filelisterror,
		g_docshowfilter:docshowfilter,
		g_filelist:filelist,

		g_userlist:userlist,
		g_currentsharedoc:currentsharedoc,

		g_memberlist:memberlist,
		g_memberlistdoc:memberlistdoc,

		g_expressionlist:expressionlist,

		g_movehandler:movehandler,

		g_dochandler:dochandler,
		g_doccallback:doccallback,

		g_loadDone:loadDone,
		g_failed:failed,

		g_loadings:loadings,

		g_gutterclick:gutterclick,

		g_firstconnect:firstconnect,

		/////////////////////// locks //////////////////////////////////
		g_loginLock:loginLock,
		g_registerLock:registerLock,
		g_viewswitchLock:viewswitchLock,
		g_operationLock:operationLock,

		////////////////////////Socket//////////////////////
		g_socket:socket,

		///////////////////////language related///////////////////
		g_strings:strings,

		///////////////////////theme related//////////////////////
		g_myTheme:myTheme
	});
	//login
	var login_information = new LoginInformation({
		login_name: '',
		login_password: ''
	});
	
	///******************data init area end**********************///

	if(!ENABLE_RUN) {
		$('#editor-run').remove();
		if(!ENABLE_DEBUG) {
			$('#editor-console').remove();
		}
	}

	if(!ENABLE_DEBUG) {
		$('#editor-debug').remove();
	}
	
	$('body').show();
	$('#login-inputName').focus();

	$('#register-inputName').focus(function(){
		$("#msg-username").html(strings['name invalid'] + "," + strings['namelength']);
	});

	$('#register-inputPassword').focus(function(){
		var name = $('#register-inputName').val();
		if(!/^[A-Za-z0-9]*$/.test(name)) {
			$("#msg-username").html(strings['name invalid']);
			$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
			$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
			return;
		}
		if(name == "" || name.length < 6 || name.length > 20) {
			$("#msg-username").html(strings['namelength']);
			$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
			$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
			return;
		}
		return;
	});

	$("#register-confirmPassword").focus(function(){
		var name = $('#register-inputName').val();
		if(!/^[A-Za-z0-9]*$/.test(name)) {
			$("#msg-username").html(strings['name invalid']);
			$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
			$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
			return;
		}
		if(name.length < 6 || name.length > 20) {
			$("#msg-username").html(strings['namelength']);
			$('#register-check').css("background","url('images/check.png') no-repeat scroll 0px 0px transparent");
			$('#register-inputName').css("border-color","rgba(255,0,0,0.8)");
			return;
		}
		return;
	});
	
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
		var margin_left = (width/2 - 108) + "px";
		$("#foot-information").css("margin-left",margin_left);	
	});


	var new_file_control = new NewFileController('#newfile',{m_global_v:global_v});
	var file_tabs_control = new FileTabsContorl('#file-tabs',{m_global_v:global_v});
	var change_pass_control = new ChangePassControl('#changepassword',{m_global_v:global_v});
	var change_avatar_control = new ChangeAvatarControl('#changeavatar',{m_global_v:global_v});
	var nav_head_control = new Nav_HeadControl('#nav-head',{m_global_v:global_v});
	var share_control = new ShareController('#share',{m_global_v:global_v});
	var login_control = new LoginControl('#login-box',{m_login_information:login_information,m_global_v:global_v}); 
	$('[localization]').html(function(index, old) {
		if(strings[old])
			return strings[old];
		return old;
	});	
	$('[title]').attr('title', function(index, old) {
		if(strings[old])
			return strings[old];
		return old;
	});
});
