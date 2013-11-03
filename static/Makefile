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
	@cd js && ../lib/uglify-js/bin/uglifyjs lib/jquery/jquery.min.js lib/jquery/jquery.wheelmenu.js lib/jquery/jquery.cookie.js lib/jszip/jszip.js lib/jszip/jszip-deflate.js lib/jszip/jszip-inflate.js lib/jszip/jszip-load.js lib/*.js Assist/loadmode.js Assist/loadtheme.js Assist/ie.js localization/*.js List/*.js App/Declare.js Assist/ejs.js Model/*.js Construct/*.js Control/*.js App/App.js *.js> ../index.js 2>/dev/null

clean:
	@rm -rf indexx.html index.css index.js inline.html split.html
