var allExpressionLists = [];

//变量监视列表相关的内容
function expressionList(table) {

	//监视列表
	var obj = $(table);
	
	//全局监视列表的长度，在我测试的时候始终是0
	var n = allExpressionLists.length;
	
	//待给监视元素分配的id
	var elemid = 1;
	
	//当前监视列表
	var elements = {};
	
	//正在编辑的监视元素id
	var editingelem = null;
	
	var r = {
	
		elements: elements,

		//清空原有的变量监视列表，初始化变量监视列表，在每次打开一个文件时调用
		clear: function() {
			obj.html(
				'<tr class="new"><td class="col1">&nbsp;</td>' +
				'<td class="col2" onclick="allExpressionLists['+n+'].addExpression()" title="' +
					strings['addexpression'] + '"><i class="icon-plus"></i></td>' +
				'<td class="col3"></td></tr>'
				);
			elemid = 1;
		},

		//添加监视调用的函数，参数expression为要查看的变量名
		addExpression: function(expression) {
			this.doneall();
			var id = elemid;
			elemid++;
			//监视列表某一项对应的DOM元素
			var elem = $(
				'<tr id="express-elem-' + n + '-' + id +'" onmouseover="$(this).find(\'a\').show()" onmouseout="$(this).find(\'a\').hide()">' +
					'<td class="col1">' + /*'&nbsp;<a href="javascript:;" class="hide" title="' + strings['removeexpression'] + '" onclick="allExpressionLists['+n+'].removeExpression('+id+')">' +
						'<i class="icon-remove"></i>' +
					'</a>' + */ '</td>' +
					'<td class="col2">' +
						'<span class="title" onclick="allExpressionLists['+n+'].renameExpression('+id+')"></span>' +
						'<input type="text" onkeydown="if(event.keyCode==13)allExpressionLists['+n+'].renameExpressionDone('+id+')" ' +
							'onblur="allExpressionLists['+n+'].doneall()"/></td>' +
					'<td class="col3"></td>' +
				'</tr>'
				);
			if(expression === undefined) {
				//没有向监视列表中输入东西
				elem.find('span').hide();
				obj.find('.new').before(elem);
				elem.find('input').focus();
				elements[id] = {elem: elem, expression: '', notnew: false};
				editingelem = id;
			} else {
				//监视列表中已经输入了东西
				elem.find('input').hide();
				elem.find('span').text(expression);
				obj.find('.new').before(elem);
				elements[id] = {elem: elem, expression: expression, notnew: true};
			}
		},
		
		//删除某一个监视的元素处理
		removeElement: function(id) {
			elements[id].elem.remove();
			if(elements[id].elem == editingelem)
				editingelem = null;
			delete elements[id];
		},
		
		//删除一个监视，调用上一个函数
		removeExpression: function(id) {
			this.doneall();
			this.removeElement(id);
		},
		
		//重命名监视，暂时没找到在什么时候调用的
		renameExpression: function(id) {
			this.doneall();
			var input = elements[id].elem.find('input');
			var span = elements[id].elem.find('.title');
			var expression = span.text();
			span.hide();
			input.val($.trim(expression));
			input.show();
			input.focus();
			input.select();
			editingelem = id;
		},
		
		//重新设定监视元素完成调用的函数，暂时没找到在什么时候调用的
		renameExpressionDone: function(id) {
			var input = elements[id].elem.find('input');
			var span = elements[id].elem.find('.title');
			var expression = $.trim(input.val());
			input.hide();
			if(expression == '') {
				//当输入的内容为空时，删除该监视
				elements[id].elem.remove();
				delete elements[id];
				editingelem = null;
				return;
			} else
				span.text(expression);
			span.show();
			elements[id].expression = expression;
		},
		
		doneall: function() {
			if(editingelem) {
				//调用的貌似是room.js中的renameExpressionDone
				r.renameExpressionDone(editingelem);
				editingelem = null;
			}
		},
		
		//根据监视变量的名字找到对应的id
		findElementByExpression: function(expression) {
			for(var k in elements) {
				var element = elements[k];
				if(element.expression == expression) {
					return element;
				}
			}
		},
		
		//修改一个监视的时候会调用，说明更改监视的操作是先删除、后添加
		removeElementByExpression: function(expression) {
			for(var k in elements) {
				var element = elements[k];
				if(element.expression == expression) {
					this.removeElement(k);
					return;
				}
			}
		},
		
		seteditingelem: function(elem) {
			editingelem = elem;
		},
		
		geteditingelem: function() {
			return editingelem;
		},
		
		//向监视列表中设定数值
		setValue: function(expression, value) {
			var v = this.findElementByExpression(expression);
			if(!v)
				return;
			var elem = v.elem;
			if(value !== null)
				elem.find('.col3').text(value);
			else
				elem.find('.col3').html('<span style="color:red">undefined</span>');
		}
	};

	//向全局监视列表中push r这个对象
	allExpressionLists.push(r);
	
	return r;
}
