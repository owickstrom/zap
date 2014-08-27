BEEFY = node_modules/.bin/beefy
BROWSERIFY = node_modules/.bin/browserify

ZAP_DIST = dist
ZAP_BROWSER_SRC = src/js/zap-browser.js
ZAP_BROWSER_DEST = dist/zap-browser.js

all: js

$(BEEFY):
	npm install

$(BROWSERIFY):
	npm install

$(ZAP_DIST):
	mkdir -p dist

js-debug: $(BROWSERIFY) $(ZAP_DIST)
	$(BROWSERIFY) --debug -s zap $(ZAP_BROWSER_SRC) > $(ZAP_BROWSER_DEST)

js: $(BROWSERIFY) $(ZAP_DIST)
	$(BROWSERIFY) -s zap $(ZAP_BROWSER_SRC) > $(ZAP_BROWSER_DEST)

copy-sources:
	rm -r dist/**
	cp -r src/zap dist/zap
	cp -r gh-pages/** dist/

build-gh-pages: js copy-sources
	sed -e "s/\\.\\//dist\\//" gh-pages/index.html  > index.html

watch: $(BEEFY) $(ZAP_DIST)
	$(BEEFY) $(ZAP_BROWSER_SRC):$(ZAP_BROWSER_DEST) --live
