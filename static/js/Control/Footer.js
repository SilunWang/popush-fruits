/************************Footer**********************/
var FooterController = can.Control.extend({

	m_global_v: '',

	init: function(element, options) {
		m_global_v = this.options.m_global_v;
		//strings: choose language pack initially By SilunWang
		m_global_v.strings = this.getCookie('fruits-language-selection') == 'fruits-english-selection' ? m_global_v.strings_en : m_global_v.strings_cn;
		m_global_v.myTheme = this.getCookie('fruits-theme-selection');
		//初始化主题
		switch (m_global_v.myTheme) {
			case 'fruits_theme_static':
				this.changeStaticTheme();
				break;
			case 'fruits_theme_1':
				this.changetheme1();
				break;
			case 'fruits_theme_2':
				this.changetheme2();
				break;
			default:
				this.changeStaticTheme();
				break;
		}
		this.element.append(can.view("../ejs/footer.ejs", {}));
		this.resize();
	},

	///////////////////////////////////////////////events/////////////////////////////////////////

	//更改为默认主题
	'#changeStaticTheme click': function() {
		this.changeStaticTheme();
	},
	//更改为第一个主题
	'#changetheme1 click': function() {
		this.changetheme1();
	},
	//更改为第二个主题
	'#changetheme2 click': function() {
		this.changetheme2();
	},
	//更改语言为英文
	'#changeEng click': function() {
		this.changeEng();
	},
	//更改语言为中文
	'#changeChn click': function() {
		this.changeChn();
	},


	////////////////////////////////////////////resize of this ejs////////////////////////////////////
	resize:function(){
		$(window).resize(function() {
			var width = $(document).width() * 0.915;
			var margin_left = (width / 2 - 108) + "px";
			$("#foot-information").css("margin-left", margin_left);
		});
	},

	//////////////////////////////////////bussiness and logic/////////////////////////////////////

	//更改为默认主题
	changeStaticTheme: function() {
		this.setCookie('fruits-theme-selection', 'fruits_theme_static');
		this.removejscssfile("anotherTheme.css", "css");
		this.removejscssfile("changebootstrap.css", "css");
	},
	//更改主题为第一个主题
	changetheme1: function() {
		this.setCookie('fruits-theme-selection', 'fruits_theme_1');
		this.removejscssfile("anotherTheme.css", "css");
		this.loadjscssfile("css/changebootstrap.css", "css");
	},
	//更改为第二个主题
	changetheme2: function() {
		this.setCookie('fruits-theme-selection', 'fruits_theme_2');
		this.removejscssfile("changebootstrap.css", "css");
		this.loadjscssfile("css/anotherTheme.css", "css");
	},

	//更改语言为英文
	changeEng: function() {
		
		this.setCookie('fruits-language-selection', 'fruits-english-selection');

		m_global_v.strings = m_global_v.strings_en;
		m_global_v.attr("g_strings", m_global_v.strings);
		$('[localization]').html(function(index, oldcontent) {
			for (var iter in m_global_v.strings_cn) {
				if (oldcontent == m_global_v.strings_cn[iter])
					return m_global_v.strings_en[iter];
			}
			return oldcontent;
		});

		$('[title]').attr('title', function(index, oldcontent) {
			for (var iter in m_global_v.strings_cn) {
				if (oldcontent == m_global_v.strings_cn[iter])
					return m_global_v.strings_en[iter];
			}
			return oldcontent;
		});
	},

	//更改语言为中文
	changeChn: function() {
		this.setCookie('fruits-language-selection', 'fruits-chinese-selection');
		m_global_v.strings = m_global_v.strings_cn;
		m_global_v.attr("g_strings", m_global_v.strings);
		$('[localization]').html(function(index, oldcontent) {
			for (var iter in m_global_v.strings_en) {
				if (oldcontent == m_global_v.strings_en[iter])
					return m_global_v.strings_cn[iter];
			}
			return oldcontent;
		});
		$('[title]').attr('title', function(index, oldcontent) {
			for (var iter in m_global_v.strings_en) {
				if (oldcontent == m_global_v.strings_en[iter])
					return m_global_v.strings_cn[iter];
			}
			return oldcontent;
		});
	},

	//设置cookie
	setCookie: function(name, value) {
		var argv = this.setCookie.arguments;
		var argc = this.setCookie.arguments.length;
		var expires = (argc > 2) ? argv[2] : null;
		if (expires != null) {
			var LargeExpDate = new Date();
			LargeExpDate.setTime(LargeExpDate.getTime() + (expires * 1000 * 3600 * 24));
		}
		document.cookie = name + "=" + escape(value) + ((expires == null) ? "" : ("; expires=" + LargeExpDate.toGMTString()));
	},

	//得到cookie
	getCookie: function(name) {
		var search = name + "="
		if (document.cookie.length > 0) {
			offset = document.cookie.indexOf(search)
			if (offset != -1) {
				offset += search.length
				end = document.cookie.indexOf(";", offset)
				if (end == -1) end = document.cookie.length
				return unescape(document.cookie.substring(offset, end))
			} else return ""
		}
	},
	
	//删除cookie
	deleteCookie: function(name) {
		var expdate = new Date();
		expdate.setTime(expdate.getTime() - (86400 * 1000 * 1));
		this.setCookie(name, "", expdate);
	},

	//加载外部js/css文件
	loadjscssfile: function(filename, filetype) {
		if (filetype == "js") {
			var fileref = document.createElement('script');
			fileref.setAttribute("type", "text/javascript");
			fileref.setAttribute("src", filename);
		} else if (filetype == "css") {
			var fileref = document.createElement("link");
			fileref.setAttribute("rel", "stylesheet");
			fileref.setAttribute("type", "text/css");
			fileref.setAttribute("href", filename);
		}
		if (typeof fileref != "undefined")
			document.getElementsByTagName("head")[0].appendChild(fileref);
	},

	//移除外部js/css文件
	removejscssfile: function(filename, filetype) {
		var targetelement;
		var targetattr;
		switch (filetype) {
			case 'js':
				targetelement = 'script';
				targetattr = 'src';
				break;
			case 'css':
				targetelement = 'link';
				targetattr = 'href';
				break;
			default:
				break;
		}
		var allsuspects = document.getElementsByTagName(targetelement);
		for (var i = allsuspects.length; i >= 0; i--) {
			if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf(filename) != -1)
				allsuspects[i].parentNode.removeChild(allsuspects[i]);
		}
	}

});
/****************************************************/

