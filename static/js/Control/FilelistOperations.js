/**********************Filelist**********************/

var FileListController = can.Control.extend({
	
	m_global_v: '',
	m_fileModel:'',
	m_object: '',
	m_room_Construct: '',

	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_room_Construct = this.options.m_room_Construct;
		m_fileModel = this.options.m_fileModel;
		this.element.append(can.view("../ejs/filelist.ejs", {}));
		this.initfilelistevent(m_global_v.filelist);
	},	
	initfilelistevent: function(fl) {
		var self = this;
		fl.onname = function(o) {
			if (m_global_v.operationLock)
				return;
			if (o.type == 'dir') {
				m_global_v.currentDir.push(o.name);
				m_global_v.currentDirString = m_global_v.getdirstring();
				m_fileModel.refreshfilelist(function() {
					m_global_v.currentDir.pop();
					m_global_v.currentDirString = m_global_v.getdirstring();
				});
			}
			
			else if(o.type == 'doc') {
				m_room_Construct.openeditor(o);
			}
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


/*********************rename*************************/
var ReNameControl = can.Control.extend({
	m_global_v: '',
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
	'#rename-ok click': function() {
		this.renamefile();
	},

	'#rename-inputName keydown': function() {
		if (event.keyCode == 13)
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
			m_fileModel.refreshfilelist(function() {;
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
	m_fileModel:'',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_fileModel = this.options.m_fileModel;
		this.element.html(can.view("../ejs/deletefile.ejs", {}));
		this.socket_io();
	},
	'#delete-ok click': function() {
		this.deletefile();
	},
	'#delete keydown': function() {
		if (event.keyCode == 13)
			this.deletefile();
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

	//events
	".close-share click": function() {
		if (m_global_v.operationLock)
			return;
		m_fileModel.refreshfilelist(function() {;
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
		if (event.keyCode == 13)
			this.share();
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

/*********************download file****************************/
var DownloadControl = can.Control.extend({
	m_global_v: '',
	m_fileModel:'',
	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		m_fileModel = this.options.m_fileModel;
		this.socket_io();
	},
	socket_io: function() {
		m_global_v.socket.on('download', function(data) {
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
			m_fileModel.refreshfilelist(function() {;
			});
		});
	},
});
