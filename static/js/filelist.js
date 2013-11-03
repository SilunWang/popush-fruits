//全局变量，所有的文件链表，猜测与数据库有关
var allFileLists = [];

//支持高亮显示的文件列表
var exttoicon = {
	'c':		'c',
	'clj':		'clj',
	'coffee':	'coffee',
	'cpp':		'cpp',
	'cs':		'cs',
	'css':		'css',
	'go':		'go',
	'h':		'h',
	'htm':		'htm',
	'html':		'html',
	'hpp':		'hpp',
	'java':		'java',
	'js':		'js',
	'json':		'json',
	'lisp':		'lisp',
	'lua':		'lua',
	'md':		'md', 
	'pas':		'pas',
	'php':		'php',
	'pl':		'pl',
	'py':		'py',
	'rb':		'rb',
	'sql':		'sql',
	'tex':		'tex',
	'vbs':		'vbs',
	'xml':		'xml'
}

//在index初始化的时候调用，创建fileList对象，table:网页上的文件列表
function fileList(table) {

	var obj = $(table);

	//一个用户的文件列表
	var elements = [];
	
	var mode = 3;
	
	//根据扩展名获取对应的图标，type:文件类型，shard:是否共享?貌似没用，ext:扩展名
	var getpic = function(type, shared, ext) {
		var s = 'images/ext/';
		if(type == 'dir') {
			s += 'dict';
		} else {
			if(exttoicon[ext])
				s += exttoicon[ext];
			else
				s += 'file';
		}
		s += '.png';
		return s;
	};
	
	//文件列表的个数
	var n = allFileLists.length;
	
	var oldhtml = '';
	
	var haveloading = false;

	//处理时间格式
	function formatDate(t) {
		var o = t.getMonth() + 1;
		var h = t.getHours();
		var m = t.getMinutes();
		var s = t.getSeconds();
		return t.getFullYear() + '-' + (o<10?'0'+o:o) + '-' + t.getDate() + ' ' +
			(h<10?'0'+h:h) + ':' + (m<10?'0'+m:m) + ':' + (s<10?'0'+s:s);
	}
	
	r = {

		elements: elements,

		//重置，在每次登入之后
		clear: function() {
			elements = [];
			this.elements = elements;
		},
		
		getmode: function() {
			return mode;
		},
		
		//设定模式，当进入共享的文件时，newmode=0，当进入拥有的文件时，newmode=2
		setmode: function(newmode) {
			mode = newmode;
		},
		
		//将原始的文档信息数据格式化成可显示的格式并显示
		//docs：原始的文档信息
		//filter：一个函数，返回文档是不是自己的
		//alwaysshard：描述一个文件夹是否被共享，根目录下为undefined
		//parent：描述这个目录
		formdocs: function(docs, filter, alwaysshared, parent) {
			this.clear();
			var all = [];
			var i;
			if(filter === undefined)
				filter = function(o){ return true; };
			for(i=0; i<docs.length; i++) {
				var o = docs[i];
				if(!((filter.flag == 1)?(filter.currentDir.length > 1 || o.owner.name == filter.currentUser.name):(filter.currentDir.length > 1 || o.owner.name != filter.currentUser.name)))
					continue;
				var n = {};
				n['path'] = o.path;
				var paths = o.path.split('/');
				if((mode & 2) == 0 && paths.length == 3) {
					n['name'] = paths[1] + '/' + paths[2];
					n['showname'] = paths[2] + '@' + paths[1];
				} else {
					n['showname'] = n['name'] = paths[paths.length - 1];
				}
				n['type'] = o.type;
				if(!alwaysshared)
					n['shared'] = (o.members && o.members.length)?true:false;
				else
					n['shared'] = true;
				n['members'] = o.members;
				if(!o.owner && parent)
					n['owner'] = parent.owner;
				else
					n['owner'] = o.owner;
				if(o.modifyTime) {
					var t = new Date(o.modifyTime);
					n['time'] = formatDate(t);
				} else {
					n['time'] = '-';
				}
				n['toString'] = function() {
					return "{ path:" + this.path + ", name:" +
					this.name + ", type:" + this.type + ", shared:" +
					this.shared + ", time:" + this.time + " }";
				}
				all.push(n);
			}
			all.sort(function(a,b) {
				if(a.type == b.type)
					return a.name>b.name?1:-1;
				else
					return a.type=='dir'?-1:1;
			});
			for(i=0; i<all.length; i++) {
				var o = all[i];
				elements.push(o);
			}
			return all;
		},
		
		//加载文件
		loading: function() {
			haveloading = true;
			this.setmode(mode + 10);
			setTimeout('global_v.attr("model_mode",allFileLists['+n+'].getmode())', 300);
		},
		
		//加载列表，标记加载完成？??
		removeloading: function() {
			if(haveloading) {
				haveloading = false;
				this.setmode(mode - 10);
			}	
		}
	};
	
	//向所有文件列表中添加当前文件列表
	allFileLists.push(r);
	
	return r;
}
