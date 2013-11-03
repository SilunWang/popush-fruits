var allUserLists = [];

//共享用户列表相关的东西
//div：共享用户管理的列表
function userList(div) {

	var obj = $(div);
	var div_id = div;
	//当前共享用户列表
	var elements = [];
	
	var n = allUserLists.length;
	
	var selected;
	
	//某一个共享用户管理列表
	r = {
		
		elements: elements,

		//重置共享用户列表，在共享管理页面和文件管理页面上调用
		clear: function() {
			$(div_id).html('');
			elements = [];
			this.elements = elements;
			selected = null;
		},
		
		//增加一个共享用户user，包括用户名和头像位置
		add: function(user) {
			var i = elements.length;
			$(div_id).append(
				'<li><a href="javascript:;" onclick="allUserLists['+n+'].onselect('+i+')">' +
				'<img class="userlistimg user-' + user.name + '" height="32" width="32" src="' + user.avatar + '">' + user.name + '</a></li>'
			);
			return elements.push(user);
		},
		
		//返回共享管理列表中选中的用户
		getselection: function() {
			return selected;
		},
		
		//更改选中用户的样式，标记选中的用户
		onselect: function(i) {
			$(div_id).find('li').removeClass('active');
			$(div_id).find('li:eq('+i+')').addClass('active');
			selected = elements[i];
		},
		
		//获取所有的共享用户，调用add函数将其添加到共享用户列表中
		fromusers: function(users) {
			this.clear();
			users.sort(function(a,b) {
				return a.name>b.name?1:-1;
			});
			for(var i=0; i<users.length; i++) {
				this.add(users[i]);
			}
		}
		
	};
	
	allUserLists.push(r);
	
	return r;

}

function userListAvatar(div) {

	//1、文件管理界面右侧的共享用户
	//2、打开文件后，右边出现的共享用户列表
	var obj = $(div);
	
	var elements = {};
	
	var n = allUserLists.length;
	
	r = {
	
		elements: elements,
		
		//清空用户列表(小头像)
		clear: function() {
			obj.html('');
			elements = {};
			this.elements = elements;
		},
		
		//增加一个共享用户
		add: function(user, owner) {
			var userobj = $(
				'<img id="avatar' + n + '-' + user.name + '" src="' + user.avatar + '" width="40" height="40"' +
				' class="pull-left online shared-character user-' + user.name + '" />'
				);
			obj.append(userobj);
			$('#avatar' + n + '-' + user.name).popover({
				html: true,
				content: '<img class="pull-left popover-character user-' + user.name + '" src="' + user.avatar + '" width="48" height="48" />' +
				'<b>' + user.name + '</b><br /><span></span><div style="clear:both;"></div>',
				placement: 'bottom',
				trigger: 'hover'
			});
			user.obj = userobj;
			user.online = false;
			user.owner = false;
			if(owner)
				user.owner = true;
			elements[user.name] = user;
		},
		
		//移除一个共享用户
		remove: function(username) {
			$('#avatar' + n + '-' + username).remove();
			if(elements[username])
				delete elements[username];
		},
		
		//给共享用户排序，并显示小头像
		fromdoc: function(doc) {
			this.clear();
			doc.members.sort(function(a,b) {
				return a.name>b.name?1:-1;
			});
			this.add(doc.owner, true);
			for(var i=0; i<doc.members.length; i++) {
				var user = doc.members[i];
				this.add(user);
			}
		},
		
		//当一个用户更换头像时会调用
		refreshpopover: function(user) {
			$('#avatar' + n + '-' + user.name).popover('destroy');
			$('#avatar' + n + '-' + user.name).popover({
				html: true,
				content: '<img class="pull-left popover-character user-' + user.name + '" src="' + user.avatar + '" width="48" height="48" />' +
				'<b>' + user.name + '</b><br /><span></span><div style="clear:both;"></div>',
				placement: 'bottom',
				trigger: 'hover'
			});
		},
		
		//标记共享用户是否在线，在进入编辑文件界面时调用，文件管理处不调用
		setonline: function(username, online) {
			if(online)
				$('#avatar' + n + '-' + username).addClass('online');
			else
				$('#avatar' + n + '-' + username).removeClass('online');
			elements[username].online = online;
		},
		
		//标记所有用户不在线
		setalloffline: function() {
			for(var i in elements) {
				var user = elements[i];
				$('#avatar' + n + '-' + user.name).removeClass('online');
				user.online = false;
			}
		},
		
		//给共享用户的头像排序
		sort: function() {
			var arr = [];
			for(var i in elements) {
				arr.push(elements[i]);
			}
			arr.sort(function(a, b) {
				return (
					(a.owner && !b.owner)?-1:
					(!a.owner && b.owner)?1:
					(a.online && !b.online)?-1:
					(!a.online && b.online)?1:
					(a.name>b.name)?1:-1
					);
			});
			for(var i=0; i<arr.length; i++) {
				obj.append(arr[i].obj);
			}
		}
	};
	
	allUserLists.push(r);
	
	return r;
	
}
