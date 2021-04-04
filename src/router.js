const { match } = require("path-to-regexp");

module.exports = class Router {
  constructor() {
    this.routes = [];
  }

  addRoute(verbs, path, fn, pipeline) {
    if (typeof verbs === 'string') {
      verbs = [verbs];
    }

    var lowerCaseVerbs = verbs.map(v => v.toLowerCase());

    var r = {
      verbs: lowerCaseVerbs,
      match: match(path),
      fn: fn,
      pipeline: pipeline
    };

    this.routes.push(r);
  }

  matchRouteAndParams(request) {
    var url = new URL(request.url);

    for (var i = 0; i < this.routes.length; i++) {
      var r = this.routes[i];

      if (r.verbs.includes(request.method.toLowerCase())) {
        var m = r.match(url.pathname);
        if (m !== false) {
          return {
            function: r.fn,
            params: m.params,
            pipeline: r.pipeline,
          };
        }
      }
    }

    return null;
  }
};
