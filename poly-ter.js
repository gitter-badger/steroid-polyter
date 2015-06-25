//Concept polyter elements by name


(function () {

  Polymer({
    is: 'poly-ter',

    routes: {},

    instances: {},

    defaultElements: {},

    _defaultRendered: false,

    previousRoute: null,

    //Route lifecycle
    _stopped: false,

    stop: function () {
      this._stopped = true;
    },

    redirect: function (route) {
      this.stop();
      page.redirect(route);
    },

    //This hook run before start loading things.
    run: function (route) {

      if (route && route.run) {
        route.run.call(this);
      }

      return this._stopped;
    },

    //Here you have the extensions instances
    before: function (route) {

      if (route && route.before) {
        route.before.call(this);
      }

      return this._stopped;
    },

    //Here you have the element instances
    action: function (route) {
        if (route && route.action) {
            route.action.call(this);
        }

        return this._stopped;
    },

    //Here the elements are rendered
    after: function (route, routeName) {

      if (route && route.after) {
        route.after.call(this);
      }
      this.previousRoute = routeName;
      return this._stopped;
    },

    //Before stop the route
    onStop: function (routeName) {
      this.stopped = false;
      var pRoute = this.routes[this.previousRoute];

      if (this.previousRoute && pRoute && pRoute.stop) {
        pRoute.stop();
      }
    },

    // Lifecycle callbacks from polymer

    created: function () {
      Polyter = this;
      console.log('### Polyter created ###');
    },

    ext: {},

    _injectExtensions: function (extName) {
      if (extName instanceof Array) {
        for (var i = extName.length; i-- > 0;) {
          if (!this.ext[extName[i]]) {
            this.ext[extName[i]] = document.createElement(extName);
            //TODO: add factoryImpl call.
          }
        }
      }
    },

    _clearInstances: function (elementName) {
      var instances = Object.getOwnPropertyNames(this.instances),
          def = Object.getOwnPropertyNames(this.defaultElements);

      def.push(elementName);

      var diff = _.difference(instances, def);

      for (var i = diff.length; i-- > 0;) {
        this.instances[diff[i]].remove();
      }

    },

    _instantiateDef: function () {
      for (var region in this.defaultElements) {
        if (this.defaultElements.hasOwnProperty(region)) {
          var name = this.defaultElements[region];

          this._instantiate(name);
        }
      }
    },

    _instantiate: function (elementName) {
      this.instances[elementName] = document.createElement(elementName);
      this.instances[elementName].name = elementName;
      _.extend(this.instances[elementName], this);
    },

    _renderDef: function () {
      for (var region in this.defaultElements) {
        if (this.defaultElements.hasOwnProperty(region)) {
          var name = this.defaultElements[region];

          this._render(name, region);
        }
      }
    },

    _render: function (elementName, region) {
      this.schema[region ? region : 'main'].appendChild(this.instances[elementName]);
    },

    loadSchema: function () {
      if (!this.schema) {
        var _this = this;

        _this.schema = {};

        _.each(Polymer.dom(_this.$.schema).getDistributedNodes(), function (el) {

          _this.schema[el.id] = el;
        });

      }
    },

    addRoute: function (routeName, options) {
      var _this = this;

      //We need load the schema here?
      this.loadSchema();

      var route = options;

      this.routes[routeName] = route;
      console.log('Adding route! ', routeName);
      page(routeName, function (ctx) {

        console.log('Entra en la ruta ' + routeName);

        _this.onStop(routeName);

        _.extend(_this, ctx);

        if (_this.run(route)) {
          return;
        }

        _this._injectExtensions(route.extensions);

        if (_this.before(route)) {
          return;
        }

        var elements = route.layoutElements;
        if (elements) {
          //TODO: Do the logic for the elements here
        }

        if (routeName === _this.previousRoute && _this.instances[route.element]) {
            console.log(_this.previousRoute, routeName);
          _.extend(_this.instances[route.element], _this);
        }
        else {

          //TODO: make this more clean
          if (!_this._defaultRendered) {
            _this._instantiateDef();
          }

          _this._instantiate(route.element);

          if (_this.action(route)) {
            return;
          }
          _this._clearInstances(route.element);

          //TODO: make this more clean
          if (!_this._defaultRendered) {
            _this._renderDef();
            _this._defaultRendered = true;
          }

          _this._render(route.element, route.region);
        }

        if (_this.after(route, routeName)) {
          return;
        }

      });

      //TODO: not call everytime!
      page.start();

    },

    defaultConfig: function (options) {
      //Load layoutElements
      if (!options) return;

      var layEl = options.layoutElements;

      if (layEl) {
        this.defaultElements = layEl;
      }

    }

  });

})();
