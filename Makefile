BEEFY = node_modules/.bin/beefy
BROWSERIFY = node_modules/.bin/browserify

ZAP_DIST = dist
ZAP_BROWSER_SRC = src/js/zap-browser.js
ZAP_BROWSER_DEST = dist/zap-browser.js

all: index.html

$(BEEFY):
	npm install

$(BROWSERIFY):
	npm install

$(ZAP_DIST):
	mkdir -p dist
	rm -rf dist/**

$(ZAP_BROWSER_DEST): dist $(BROWSERIFY) $(ZAP_DIST)
	$(BROWSERIFY) -s zap $(ZAP_BROWSER_SRC) > $(ZAP_BROWSER_DEST)

dist/zap: dist
	cp -r src/zap dist/zap

dist/repl.js: dist
	cp -r gh-pages/** dist/

index.html: $(ZAP_BROWSER_DEST) dist/zap dist/repl.js
	sed -e "s/\"\\.\\//\"dist\\//" gh-pages/index.html > index.html
	sed -e "s/\\.\\.\\/src/dist\\//" gh-pages/repl.js  > dist/repl.js

clean:
	rm -rf dist index.html

watch: $(BEEFY) $(ZAP_DIST)
	$(BEEFY) $(ZAP_BROWSER_SRC):zap-browser.js --live --cwd gh-pages -- -s zap
