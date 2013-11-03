
///这个文件用来初始化文件列表中每个文件的点击事件
///封装了点击事件所触发的独立模块，处理了模块之间通信的关系

/**********************Filelist**********************/

var FileListController = can.Control.extend({
	
	m_global_v: '',
	m_fileModel:'',
	m_object: '',
	m_room_Construct: '',

	init: function(element, options) {
		var self = this;
		m_global_v = this.options.m_global_v;
		m_room_Construct = this.options.m_room_Construct;
		m_fileModel = this.options.m_fileModel;
		this.element.append(can.view("../ejs/filelist.ejs", {
			m_global_v:self.options.m_global_v
		}));
		this.initfilelistevent(m_global_v.filelist);
	},
	//初始化文件列表的事件	
	initfilelistevent: function(fl) {
		var self = this;
		//点击某个文件的事件
		fl.onname = function(o) {
			if (m_global_v.operationLock)
				return;
			//文件夹的情况，进入文件夹
			if (o.type == 'dir') {
				m_global_v.currentDir.push(o.name);
				m_global_v.attr("model_currentDir", m_global_v.currentDir);
				m_global_v.currentDirString = m_global_v.getdirstring();
				m_fileModel.refreshfilelist(function() {
					m_global_v.currentDir.pop();
					m_global_v.attr("model_currentDir", m_global_v.currentDir);
					m_global_v.currentDirString = m_global_v.getdirstring();
				});
			}
			//文件的情况，进入编辑页面
			else if(o.type == 'doc') {
				m_room_Construct.openeditor(o);
			}
		};

		//点击某个文件的删除按钮
		fl.ondelete = function(o) {
			if (o.type == 'dir')
				$('#delete').find('.folder').text(strings['folder']);
			else
				$('#delete').find('.folder').text(strings['file']);
			$('#delete-name').text(o.name);
			$('#delete').modal('show');
			//传递所删除的文件的对象
			m_global_v.delete_obj = o;
		};

		//点击某个文件的重命名按钮
		fl.onrename = function(o) {
			$('#rename-inputName').val(o.name);
			$('#rename .control-group').removeClass('error');
			$('#rename .help-inline').text('');
			$('#rename').modal('show');
			//传递所重命名的文件的对象
			m_global_v.rename_obj = o;
		};

		//点击某个文件的共享按钮
		fl.onshare = function(o) {
			$('#share-name').text(o.name);
			$('#share-inputName').val('');
			$('#share-message').hide();
			m_global_v.userlist.fromusers(o.members);
			$('#share').modal('show');
			//传递共享文件对象
			m_global_v.currentsharedoc = o;
		};

		//点击某个文件的下载按钮
		fl.ondownload = function(o) {
			//向后台发送所下载的文件的路径
			m_global_v.socket.emit('download', {
				path: o.path
			});
		};
	}

});
/****************************************************/


/*********************rename*************************/

//独立模块：弹出的重命名框

var ReNameControl = can.Control.extend({
	m_global_v: '',
	//文件操作的全局model
	m_fileModel:'',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_fileModel = this.options.m_fileModel;
		this.element.html(can.view("../ejs/rename.ejs", {}));
		this.socket_io();
		$('#rename').on('shown', function() {
			$('#rename-inputName').focus();
		});
	},

	//////////////////////////////////////events////////////////////////////////
	
	'#rename-ok click': function() {
		this.renamefile();
	},

	'#rename-inputName keydown': function() {
		if (event.keyCode == 13)
			this.renamefile();
	},

	////////////////////////////////////business and logic/////////////////////////////

	//重命名一个文件	
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

	//后台重命名完成后回调的函数
	renamedone: function(data) {
		if (data.err) {
			m_global_v.showmessageindialog('rename', data.err, 0);
			m_global_v.operationLock = false;
		} else {
			$('#rename').modal('hide');
			m_global_v.operationLock = false;
			m_fileModel.refreshfilelist(function() {;
			});
		}
		m_global_v.removeloading('rename-buttons');
	},

	//////////////////////////////socket////////////////////////	

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
	//文件操作的全局model
	m_fileModel:'',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_fileModel = this.options.m_fileModel;
		this.element.html(can.view("../ejs/deletefile.ejs", {}));
		this.socket_io();
		this.keydown();
	},

	//////////////////////////////////////events////////////////////////////////

	'#delete-ok click': function() {
		this.deletefile();
	},
	//自定义的keydown
	keydown:function(){
		var self = this;
		$('#delete').keydown(function(){
			self.deletefile();		
		});
	},

	////////////////////////////////////business and logic/////////////////////////////
	
	//删除一个文件
	deletefile: function() {
		if (m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.loading('delete-buttons');
		m_global_v.socket.emit('delete', {
			path: m_global_v.delete_obj.path
		});
	},

	///////////////////////////////////////socket/////////////////////////////////////

	socket_io: function() {
		m_global_v.socket.on('delete', function(data) {
			$('#delete').modal('hide');
			if (data.err) {
				m_global_v.showmessagebox('delete', data.err, 1);
				m_global_v.operationLock = false;
			} else {
				m_global_v.operationLock = false;
				m_fileModel.refreshfilelist(function() {;
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
	//文件操作的全局model
	m_fileModel:'',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_fileModel = this.options.m_fileModel;
		this.element.append(can.view("../ejs/share.ejs", {}));
		this.socket_io();
		$('#share').on('shown', function() {
			$('#share-inputName').focus();
		});
	},

	//////////////////////////////////////events////////////////////////////////

	".close-share click": function() {
		if (m_global_v.operationLock)
			return;
		m_fileModel.refreshfilelist(function() {;});
		$('#share').modal('hide');
	},

	"#share-submit click": function() {
		this.share();
	},
	'#unshare-submit click': function() {
		this.unshare();
	},
	'#share-inputName keydown': function() {
		if (event.keyCode == 13)
			this.share();
	},

	////////////////////////////////////business and logic/////////////////////////////

	//添加一个共享
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

	//删除一个共享
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

	//共享文件和取消共享完毕后的回调函数
	sharedone: function(data) {
		if (!data.err) {
			m_global_v.userlist.fromusers(data.doc.members);
		}
		$('#share-message').hide();
		m_global_v.removeloading('share-buttons');
		m_global_v.operationLock = false;
	},

	///////////////////////////////////////socket/////////////////////////////////////

	socket_io: function() {
		var self = this;
		m_global_v.socket.on('share', function(data) {
			if (data.err) {
				m_global_v.showmessage('share-message', data.err, 'error');
				m_global_v.operationLock = false;
				m_global_v.removeloading('share-buttons');
			} else {
				m_fileModel.dochandler = self.sharedone;
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
				m_fileModel.dochandler = self.sharedone;
				m_global_v.socket.emit('doc', {
					path: m_global_v.currentsharedoc.path
				});
			}
		});
	}
});
/****************************************************/

/*********************download file****************************/
var DownloadControl = can.Control.extend({
	m_global_v: '',
	//文件操作的全局model
	m_fileModel:'',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_fileModel = this.options.m_fileModel;
		this.socket_io();
	},

	///////////////////////////////////////socket/////////////////////////////////////

	socket_io: function() {
		//来自服务端的download响应
		m_global_v.socket.on('download', function(data) {

			///////////////////////////////////回调的逻辑/////////////////////////////

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
		//来自服务端的upload的响应
		m_global_v.socket.on('uploadzip', function(data) {
			m_global_v.showmessagebox('zip', 'upload finished. Error number:' + data.e, 1);
			m_fileModel.refreshfilelist(function() {;
			});
		});
	},
});

/****************************************************/


/********************currentdir**********************/

var CurrentdirController = can.Control.extend({
	m_global_v: '',
	self:this,
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		this.element.append(can.view("../ejs/currentdir.ejs", {
			m_global_v:self.options.m_global_v
		}));
	}
});
