// depends on nscl/content/patchWindow.js
"use strict";
ns.on("capabilities", event => {
  debug("WebGL Hook", document.URL, document.documentElement && document.documentElement.innerHTML, ns.capabilities); // DEV_ONLY
  if (ns.allows("webgl")) return;
  let env = {eventName: `nsWebgl:${uuid()}`};
  window.addEventListener(env.eventName, e => {
    let request = {
      id: "noscript-webgl",
      type: "webgl",
      url: document.URL,
      documentUrl: document.URL,
      embeddingDocument: true,
    };
    seen.record({policyType: "webgl", request, allowed: false});
    let canvas = e.target;
    if (canvas instanceof HTMLCanvasElement) {
      try {
        let ph = PlaceHolder.create("webgl", request);
        ph.replace(canvas);
        PlaceHolder.listen();
      } catch (e) {
        error(e);
      }
    }
    notifyPage();
  }, true);

  function modifyGetContext(win, env) {
      let proto = win.HTMLCanvasElement.prototype;
      let getContext = proto.getContext;
      exportFunction(function(type, ...rest) {
        if (type && type.toLowerCase().includes("webgl")) {
          let target = document.contains(this) ? this : window;
          target.dispatchEvent(new Event(env.eventName, {composed: true}));
          return null;
        }
        return getContext.call(this, type, ...rest);
      }, proto, {defineAs: "getContext"});
  }

  patchWindow(modifyGetContext, env);
});
