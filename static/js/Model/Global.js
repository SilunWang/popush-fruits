
///这个文件封装了全局的Model，主要封装一些公共的变量和函数
///协助相互独立的Control进行通信
///在整个网站运行的生命周期中，只有一个model的实例存在


/********************全局Model*********************/
GlobalVariables = can.Model.extend({},{
	self:this,

	//初始化
	//定义popush的全局Model的类成员
	init:function(global_data){
		//当前目录的按'/'拆分成的数组
		this.currentDir = [];
		//当前目录的完整String值
		this.currentDirString = '';
		//当前目录的模式，拥有的文件或共享的文件
		this.dirMode = 'owned';
		//文件类型
		this.newfiletype = 'doc';
		//文件出错调用的函数
		this.filelisterror = function(){;};
		//渲染文件列表所需要传递的参数
		this.docshowfilter = {};
		//文件列表
		this.filelist = '';
		//共享用户列表
		this.userlist = '';
		//当前共享的文件
		this.currentsharedoc = '';
		//编辑室在线成员
		this.memberlist = '';
		//当前编辑的文件
		this.memberlistdoc = '';
		//监视表达式列表
		this.expressionlist = '';
		//
		this.movehandler = '';
		//编辑室回到文件列表所用到文件列表对象的引用
		this.backhome = '';

		//是否加载完成
		this.loadDone = false;
		//是否失败
		this.failed = false;
		//加载的内容
		this.loadings = {};
		//是否是第一次连接
		//指示下次是否自动登陆
		this.firstconnect = true;

		/////////////////////// locks //////////////////////////////////
		//登录锁，为true时不能再进行登录操作，下同		
		this.loginLock = false;
		//注册锁
		this.registerLock = false;
		//界面切换的锁
		this.viewswitchLock = false;
		//其他一系列操作的锁，共用一把锁，主要是文件操作
		this.operationLock = false;

		////////////////////////Socket//////////////////////
		//用于与服务器通信的socket
		this.socket = global_data.g_socket;

		///////////////////////language related///////////////////
		//界面中所有文字所对应的变量
		this.strings = global_data.g_strings;
		//变量的英文对应关系
		this.strings_en = global_data.g_strings_en;
		//变量的中文对应关系
		this.strings_cn = global_data.g_strings_cn;
		///////////////////////theme related//////////////////////
		//当前的主题
		this.myTheme = global_data.g_myTheme;
		//通信所用，指示删除的是哪个文件
		this.delete_obj = '';
		//通信所用，指示重命名的是哪个文件
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
	htmlescape: function(text) {
		return text.
		replace(/&/gm, '&amp;').
		replace(/</gm, '&lt;').
		replace(/>/gm, '&gt;').
		replace(/ /gm, '&nbsp;').
		replace(/\n/gm, '<br />');
	},
	//返回登陆界面
	//由于多个独立的control调用，因此设为公共函数
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
			var w = $('#login-box').parent('*').width();
			$('#login-box').css('left', ((w - 420) / 2 - 30) + 'px');
		});
		$('#nav-head').fadeOut('fast');
		$('#filecontrol').hide();
		$('#editor').hide();
		$('#login').fadeIn('fast');
		//SilunWang fix a bug(footer disappear)
		$('#footer').fadeIn('fast');
		$('.modal').modal('hide');
	},


	/********loading*******/

	//更改dom元素为"加载中"的样式
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
	//移除"加载中"的样式
	removeloading: function(id) {
		if (!this.loadings[id])
			return;
		this.loadings[id].self.show();
		this.loadings[id].loading.remove();
		delete this.loadings[id];
	},
	//清除所有正在loadings队列的元素
	cleanloading: function() {
		for (var k in this.loadings) {
			this.removeloading(k);
		}
	},
	//加载失败显示的样式
	loadfailed: function() {
		if (this.loadDone)
			return;
		this.failed = true;
		$('#loading-init').remove();
		this.showmessage('login-message', 'loadfailed');
	},


	/*************show message***********/	
	//在原界面显示消息
	showmessage: function(id, stringid, type) {
		var o = $('#' + id);
		o.removeClass('alert-error');
		o.removeClass('alert-success');
		o.removeClass('alert-info');
		if (type && type != '' && type != 'warning')
			o.addClass('alert-' + type);
		if (this.strings[stringid])
			$('#' + id + ' span').html(this.strings[stringid]);
		else
			$('#' + id + ' span').html(stringid);
		o.slideDown();
	},
	//在对话框中显示消息
	showmessageindialog: function(id, stringid, index) {
		if (index === undefined) {
			$('#' + id + ' .control-group').addClass('error');
			if (this.strings[stringid])
				$('#' + id + ' .help-inline').text(this.strings[stringid]);
			else
				$('#' + id + ' .help-inline').text(stringid);
		} else {
			$('#' + id + ' .control-group:eq(' + index + ')').addClass('error');
			if (this.strings[stringid])
				$('#' + id + ' .help-inline:eq(' + index + ')').text(this.strings[stringid]);
			else
				$('#' + id + ' .help-inline:eq(' + index + ')').text(stringid);
		}
	},
	//显示消息对话框
	showmessagebox: function(title, content, timeout) {
		if (this.strings[title])
			$('#messagedialogLabel').html(this.strings[title]);
		else
			$('#messagedialogLabel').html(title);
		if (this.strings[content])
			$('#messagedialogContent').html(this.strings[content]);
		else
			$('#messagedialogContent').html(content);
		$('#messagedialog').modal('show');
		t = setTimeout('$(\'#messagedialog\').modal(\'hide\');', timeout * 1000);
	}

});
/****************************************************/
