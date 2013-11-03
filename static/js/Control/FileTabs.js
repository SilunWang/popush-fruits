/*******************fileTabs*************************/


//文件列表标题栏的选择模式：拥有者和共享，及其下拉列表操作：新建文件，文件夹，上传文件，上传压缩包，新建工程，从git导入
var FileTabsContorl = can.Control.extend({
	//全局model的引用
	m_global_v: '',
	m_fileModel:'',
	self: this,
	//初始化
	init: function(element, options) {
		self.m_global_v = this.options.m_global_v;
		self.m_fileModel = this.options.m_fileModel;		
		this.element.append(can.view("../ejs/filetab.ejs", {}));
	},

	//////////////////////////////////////events//////////////////////////////

	//点击切换栏的拥有的文件
	'#ownedfileex click': function() {
		if (m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.dirMode = 'owned';

		m_global_v.currentDir = [m_global_v.currentUser.name];
		m_global_v.currentDirString = m_global_v.getdirstring();
		m_global_v.docshowfilter = {
			flag: 1,
			currentDir: m_global_v.currentDir,
			currentUser: m_global_v.currentUser,
			htmlescape:m_global_v.htmlescape
		};
		$('#current-dir').html(m_global_v.getdirlink());
		m_fileModel.refreshfilelist(function() {;
		});

		$('#ownedfile').show();
		$('#ownedfileex').hide();
		$('#sharedfile').removeClass('active');
	},

	//点击切换栏的共享的文件
	'#sharedfile click': function() {
		if (m_global_v.dirMode == 'shared')
			return;
		if (m_global_v.operationLock)
			return;
		m_global_v.operationLock = true;
		m_global_v.dirMode = 'shared';

		m_global_v.currentDir = [m_global_v.currentUser.name];
		m_global_v.currentDirString = m_global_v.getdirstring();
		m_global_v.docshowfilter = {
			flag: 0,
			currentDir: m_global_v.currentDir,
			currentUser: m_global_v.currentUser,
			htmlescape:m_global_v.htmlescape
		};

		$('#current-dir').html(m_global_v.getdirlink());
		m_fileModel.refreshfilelist(function() {;
		});

		$('#ownedfile').hide();
		$('#ownedfileex').show();
		$('#sharedfile').addClass('active');
	},

	//点击新建文件按钮的操作
	'#new-file click': function() {
		$('#newfile-inputName').val('');
		$('#newfile .control-group').removeClass('error');
		$('#newfile .help-inline').text('');
		$('#newfileLabel').text(strings['newfile']);
		m_global_v.newfiletype = 'doc';
	},

	//点击新建文件夹
	'#new-file-folder click': function() {
		$('#newfile-inputName').val('');
		$('#newfile .control-group').removeClass('error');
		$('#newfile .help-inline').text('');
		$('#newfileLabel').text(strings['newfolder']);
		m_global_v.newfiletype = 'dir';
	},

	//点击上传文件
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

	//点击上传文件夹
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

	//点击新建工程
	'#newprojectopen click': function() {
		if(m_global_v.currentDirString.split('/').length > 2){
			alert("cannot new project in this dir");
			return false;
		}
		$('#newfile-inputName').val('');
		$('#newfile .control-group').removeClass('error');
		$('#newfile .help-inline').text('');
		$('#newfileLabel').text(strings['createproject']);
		m_global_v.newfiletype = 'pro';
		return true;
	},

	//点击从git导入
	'#creategitfolder click': function() {
		if(m_global_v.currentDirString.split('/').length > 2){
			alert("cannot new project in this dir");
			return false;
		}
		$('#newfile-inputName').val('');
		$('#newfile .control-group').removeClass('error');
		$('#newfile .help-inline').text('');
		$('#newfileLabel').text(strings['GitFolder']);
		m_global_v.newfiletype = 'git';
	}
});
/****************************************************/


/*******************New file*************************/

//“新建文件”弹出框的业务和事件处理
//需要处理的包括新建文件，新建文件夹，新建工程，从git导入
//这些业务处理的逻辑不同，但是共用一$('#newfile')
var NewFileController = can.Control.extend({
	m_global_v: '',
	m_fileModel:'',
	m_filename: '',
	m_filenameId: '#newfile-inputName',
	init: function(element, options) {
		m_new_file = this.options.m_new_file;
		m_global_v = this.options.m_global_v;
		m_fileModel = this.options.m_fileModel;
		this.element.append(can.view("../ejs/newfile.ejs", {
			control_new_file: m_new_file
		}));
		this.socket_io();
		$('#newfile').on('shown', function() {
			$('#newfile-inputName').focus();
		});
	},

	/////////////////////////////////////////////////events//////////////////////////////////////////

	'#newfile-submit click': function() {
		this.m_filename = $(this.m_filenameId).val();
		this.newfile();
	},

	'#newfile-inputName keydown': function() {
		if (event.keyCode == 13)
			this.newfile();
	},

	//////////////////////////////////logic and business////////////////////////////////

	//new file: 新建文件，新建文件夹，新建工程在这部分前端逻辑都一样，区别是后台的操作
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
			
			//三种操作不一样的在于发送的文件的类型不同，即json中的type变量
			m_global_v.socket.emit('new', {
				type: m_global_v.newfiletype,
				path: m_global_v.currentDirString + '/' + name
			});
		}
	},

	//从github引入
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

	////////////////////////////////////////////socket reaction/////////////////////////////////////
 
	socket_io: function() {
		//从服务器端收到'new'请求操作对应的数据，并调用相应的函数
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
			m_fileModel.refreshfilelist(function() {;});
		});
	}
});
/****************************************************/
