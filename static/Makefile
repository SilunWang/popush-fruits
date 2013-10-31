.PHONY: clean static all

all:split

static:split
	@echo ">  make index.html"
	@mv split.html index.html

inline:inline.html
	@rm -rf indexx.html index.css anotherTheme.css changebootstrap.css index.js split.html

split:split.html
	@rm -rf indexx.html inline.html

inline.html:indexx.html index.css index.js
	@echo ">  make inline.html"
	@node lib/inline.js indexx.html index.css index.js > inline.html

split.html:indexx.html index.css index.js
	@echo ">  make split.html"
	@node lib/split.js indexx.html index.css index.js > split.html

indexx.html:index.html
	@java -jar lib/compressor.jar index.html > indexx.html

index.css:$(wildcard css/*.css)
	@echo ">  make index.css"

	@cd css && ../lib/uglifycss/uglifycss --ugly-comments bootstrap.min.css codemirror.css popush.css wheelmenu.css> ../index.css

index.js:$(wildcard js/*.js)
	@echo ">  make index.js"
	@cd js && ../lib/uglify-js/bin/uglifyjs conf.js jquery.min.js jquery.wheelmenu.js jquery.cookie.js socket.io.min.js firebase.js newMultiConnection.js bootstrap.min.js codemirror.js loadmode.js localization/zh-cn.js localization/zh-en.js ie.js filelist.js userlist.js expressionlist.js loadtheme.js can.jquery.js popush.js roomModel.js roomControl.js run-debugControl.js roomApp.js socketControl.js editorControl.js> ../index.js 2>/dev/null

clean:
	@rm -rf indexx.html index.css index.js inline.html split.html
