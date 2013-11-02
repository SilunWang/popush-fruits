/****************全局变量区域，已经封装****************/

//Room部分的Model

var RoomModel = can.Model.extend({}, {

	//room.js相关的变量
	vars: {
		//标记是否处于运行状态
		runLock: false,
		//标记是否处于调试状态
		debugLock: false,
		//标记是否处于“正在保存状态”
		waiting: false,
		//标记代码是否可以运行
		runable: true,
		//记录可以运行的扩展名
		runableext: [
			'c', 'cpp', 'js', 'py', 'pl', 'rb', 'lua', 'java'
		],

		//标记代码是否可以调试
		debugable: true,
		//记录可以调试的扩展名
		debugableext: [
			'c', 'cpp'
		],

		cursors: {},

		//文档目标
		docobj: undefined,

		lock: false,
		doc: undefined,
		q: [],
		timer: null,

		//扩展名
		ext: undefined,
		//断点队列
		bq: [],
		//一个字符串，描述这个文件每一行的断点信息，1表示有断点，0表示没有断点
		bps: "",
		//标记刚刚运行的语句所在行数
		runningline: -1,

		//标记控制台是否处于打开状态
		consoleopen: false,

		old_text: undefined,

		old_bps: undefined,

		//上次滚动条的位置
		oldscrolltop: 0,

		//buffertext : 输入的内容，删除为”“
		//bufferfrom != -1 && bufferto != -1 -- 用backspace删除
		//bufferfrom != -1 && bufferto == -1 -- 普通的输入
		//bufferfrom == -1 && bufferto == -1 -- 选中一段文字删除
		buffertext: "",
		bufferfrom: -1,
		bufferto: -1,
		buffertimeout: SAVE_TIME_OUT,

		//记录保存的时间
		savetimestamp: undefined,
		//标记当前是否正在保存
		issaving: false,
		//从本地完全出队到更新视图的延时，用途待定
		savetimeout: 500,

		chatstate:undefined,

		editor:undefined
	},

	//初始化函数
	init: function() {
		//room.js中变量的一些初始化设定
		var self = this;
	},

	//根据各种状态判断现在是否可运行
	runenabled: function() {
		var vars = this.vars;
		return (this.vars.runable && !this.vars.debugLock && (!this.vars.issaving || this.vars.runLock));
	},

	//根据各种状态判断现在是否可调试
	debugenabled: function() {
		var vars = this.vars;
		return (this.vars.debugable && !this.vars.runLock && (!this.vars.issaving || this.vars.debugLock));
	},

	//根据扩展名（参数ext）判断代码是否可被运行
	isrunable: function(ext) {
		for (var i = 0; i < this.vars.runableext.length; i++) {
			if (this.vars.runableext[i] == ext)
				return true;
		}
		return false;
	},

	//根据扩展名（参数ext）判断代码是否可被调试
	isdebugable: function(ext) {
		for (var i = 0; i < this.vars.debugableext.length; i++) {
			if (this.vars.debugableext[i] == ext)
				return true;
		}
		return false;
	}
});
