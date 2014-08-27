BEEFY = node_modules/.bin/beefy
BROWSERIFY = node_modules/.bin/browserify

ZAP_DIST = dist
ZAP_BROWSER_SRC = src/js/zap-browser.js
ZAP_BROWSER_DEST = dist/zap-browser.js

all: build-dist

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

build-dist: js
	cp -r src/zap dist/zap

watch: $(BEEFY) $(ZAP_DIST)
	$(BEEFY) $(ZAP_BROWSER_SRC):$(ZAP_BROWSER_DEST) --live
