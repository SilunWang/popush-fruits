/********************全局变量Model*********************/
GlobalVariables = can.Model.extend({},{
	self:this,

	init:function(global_data){
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

		this.backhome = '';

		this.loadDone = false;
		this.failed = false;

		this.loadings = {};

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
			if(i == 0 && this.dirMode == 'shared')
				s += ' / <a href="javascript:;" onclick="' + before + 'global_v.backto(' + j + ');">shared@' + this.htmlescape(t) + '</a>';
			else
				s += ' / <a href="javascript:;" onclick="' + before + 'fileModel.backto(' + j + ');">' + this.htmlescape(t) + '</a>';
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
	}
});
/****************************************************/
