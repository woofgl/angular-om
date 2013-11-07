(function(angular) {
    var nativeBind = Function.prototype.bind;
    var slice = Array.prototype.slice;
    var ctor = function() {
    };
    function _bind(func, context){
        var bound, args;
        // 优先调用宿主环境提供的bind方法
        if(func.bind === nativeBind && nativeBind)
            return nativeBind.apply(func, slice.call(arguments, 1));
        // func参数必须是一个函数(Function)类型
        if(!angular.isFunction(func))
            throw new TypeError;
        // args变量存储了bind方法第三个开始的参数列表, 每次调用时都将传递给func函数
        args =  slice.call(arguments, 2);
        return bound = function() {
            if(!(this instanceof bound))
                return func.apply(context, args.concat(slice.call(arguments)));
            ctor.prototype = func.prototype;
            var self = new ctor;
            var result = func.apply(self, args.concat(slice.call(arguments)));
            if(Object(result) === result)
                return result;
            return self;
        };
    }

    var angularOm = angular.module('om.directives', []);

    angular.module('om.directives').factory('widgetFactory', ['$parse', '$log', function($parse, $log) {

        // o-* attributes that should not be $parsed or $evaluated by gatherOptions
        var ignoredAttributes = {
            oDataSource: true,
            oOptions: true,
            oRebind: true
        };

        var mixin = function(omWidget, scope, options, attrName, attrValue) {

            // regexp for matching regular options attributes and event handler attributes
            // The first matching group will be defined only when the attribute starts by o-on- for event handlers.
            // The second matching group will contain the option name.
            var matchExp = /o(On)?([A-Z].*)/;
            var jsMatchExp = /^\s*[javascript|js]:(.*)/;

            // ignore attributes that do not map to widget configuration options
            if( ignoredAttributes[attrName] ) {
                return;
            }

            var match = attrName.match(matchExp), optionName, fn;

            if( match ) {
                // Lowercase the first letter to match the option name om expects.
                optionName = match[2].charAt(0).toLowerCase() + match[2].slice(1);

                if( match[1] ) {
                    // This is an event handler attribute (k-on-*)
                    // Parse the expression so that it get evaluated later.
                    fn = $parse(attrValue);
                    // Add a kendo event listener to the options.
                    options[optionName] = function(e) {
                        // Make sure this gets invoked in the angularjs lifecycle.
                        if(scope.$root.$$phase === '$apply' || scope.$root.$$phase === '$digest') {
                            fn({kendoEvent: e});
                        } else {
                            scope.$apply(function() {
                                // Invoke the parsed expression with a kendoEvent local that the expression can use.
                                fn(scope, {kendoEvent: e});
                            });
                        }
                    };
                } else {
                    // Evaluate the angular expression and put its result in the widget's options object.
                    // Here we make a copy because the om widgets make changes to the objects passed in the options
                    // and om-refresh would not be able to refresh with the initial values otherwise.
                    var jsMatch = attrValue.match(jsMatchExp);
                    if(jsMatch){
                        if(jsMatch[1]){
                            options[optionName] =eval(jsMatch[1]);
                        }
                    }else{
                        options[optionName] = angular.copy(scope.$eval(attrValue));
                    }

                    if( options[optionName] === undefined && attrValue.match(/^\w*$/) ) {
                        // if the user put a single word as the attribute value and the expression evaluates to undefined,
                        // she may have wanted to use a string literal.
                        $log.warn(omWidget + '\'s ' + attrName + ' attribute resolved to undefined. Maybe you meant to use a string literal like: \'' + attrValue + '\'?');
                    }
                }
            }
        };

        // Gather the options from defaults and from attributes
        var gatherOptions = function(scope, element, attrs, omWidget, opts) {

            // make a deep clone of the options object provided by the o-options attribute, if any.
            var options = angular.element.extend(true, {}, opts||{}, scope.$eval(attrs.oOptions));

            // Mixin the data from the element's o-* attributes in the options
            angular.forEach(attrs, function(value, name) {
                mixin(omWidget, scope, options, name, value);
            });

            // The kDataSource directive sets the $kendoDataSource data on the element it is put on.
            // A datasource set in this way takes precedence over the one that could have been provided in options object passed
            // in the directive's attribute and that is used as the initial options object.
            options.dataSource = element.inheritedData('$omDataSource') || options.dataSource;

            // TODO: invoke controller.decorateOptions to allow other directives (or directive extensions)
            //       to modify the options before they get bound. This would provide an extention point for directives
            //       that require special processing like compiling nodes generated by kendo so that angular data binding
            //       can happen in kendo widget templates for example.
            //controller.decorateOptions(options);

            return options;

        };

        // Create the om widget with gathered options
        var create = function(scope, element, attrs, omWidget, opts, ngModel) {
            console.log(omWidget);

            // Create the options object
            var options = gatherOptions(scope, element, attrs, omWidget, opts);

            // Bind the om widget to the element and return a reference to the widget.

            var widget = function () {
                var args = Array.prototype.slice.call(arguments, 0);
                return element[omWidget].apply(element, args)
            };
            var context = {element: element, scope: scope, ngModel: ngModel, widget:widget};
            angular.forEach(options, function(fn, key){
                if(angular.isFunction(fn)){
                   options[key] = _bind(fn, context);
                }
            })
            widget(options);

            return widget;
//            return element[omWidget](options).data(omWidget);
        };

        return {
            create: create
        };

    }]);

    angular.module('om.directives').factory('directiveFactory', ['widgetFactory', '$timeout', '$parse',
        function(widgetFactory, $timeout, $parse) {

            function exposeWidget(widget, scope, attrs, omWidget) {
                if( attrs[omWidget] ) {
                    // expose the widget object
                    var set = $parse(attrs[omWidget]).assign;
                    if( set ) {
                        // set the value of the expression to the om widget object to expose its api
                        set(scope, widget);
                    } else {
                        throw new Error( omWidget + ' attribute used but expression in it is not assignable: ' + attrs[omWidget]);
                    }
                }
            }

            // $timeout tracking
            var $timeoutPromise = null;
            var unsetTimeoutPromise = function() { $timeoutPromise = null };

            var create = function(omWidget, metaData) {
                metaData = metaData||{};
                return {
                    // Parse the directive for attributes and classes
                    restrict: 'ACE',
                    transclude: true,
                    require: '?ngModel',
                    scope: false,
                    controller: [ '$scope', '$attrs', '$element', '$transclude', function($scope, $attrs, $element, $transclude) {

                        // Make the element's contents available to the om widget to allow creating some widgets from existing elements.
                        $transclude(function(clone){
                            $element.append(clone);
                        });
                        // TODO: add functions to allow other directives to register option decorators
                    }],

                    link: function(scope, element, attrs, ngModel) {

                        var widget;

                        // Instead of having angular digest each component that needs to be setup
                        // Use the same timeout until the timeout has been executed, this will cause all
                        //   directives to be evaluated in the next cycle, instead of over multiple cycles.
                        if (!$timeoutPromise)
                            $timeoutPromise = $timeout(unsetTimeoutPromise);

                        // Bind kendo widget to element only once interpolation on attributes is done.
                        // Using a $timeout with no delay simply makes sure the function will be executed next in the event queue
                        // after the current $digest cycle is finished. Other directives on the same element (select for example)
                        // will have been processed, and interpolation will have happened on the attributes.
                        $timeoutPromise.then( function() {

                            // create the kendo widget and bind it to the element.
                            widget = widgetFactory.create(scope, element, attrs, omWidget, metaData.options||{}, ngModel);

                            exposeWidget(widget, scope, attrs, omWidget);

                            // if o-rebind attribute is provided, rebind the kendo widget when
                            // the watched value changes
                            if( attrs.oRebind ) {
                                // watch for changes on the expression passed in the k-rebind attribute
                                scope.$watch(attrs.oRebind, function(newValue, oldValue) {
                                    if(newValue !== oldValue) {
                                        // create the o widget and bind it to the element.
                                        widget = widgetFactory.create(scope, element, attrs, omWidget, metaData.options||{}, ngModel);
                                        exposeWidget(widget, scope, attrs, omWidget);
                                    }
                                }, true); // watch for object equality. Use native or simple values.
                            }

                            // Cleanup after ourselves
                            scope.$on( '$destroy', function() {
                                widget.destroy();
                            });

                            // if ngModel is on the element, we setup bi-directional data binding
                            if (ngModel) {
                                /*if( !widget.value ) {
                                    throw new Error('ng-model used but ' + omWidget + ' does not define a value accessor');
                                }*/
                                if( !metaData.bind ) {
                                    throw new Error('ng-model used but ' + omWidget + ' does not define a bind function');
                                }
                                metaData.bind(omWidget, widget, scope, ngModel, element, attrs);
/*
                                // Angular will invoke $render when the view needs to be updated with the view value.
                                ngModel.$render = function() {
                                    // Update the widget with the view value.
                                    widget.value(ngModel.$viewValue);
                                };

                                // if the model value is undefined, then we set the widget value to match ( == null/undefined )
                                if (widget.value !== undefined) {
                                    widget.value(ngModel.$viewValue || null);
                                }

                                // In order to be able to update the angular scope objects, we need to know when the change event is fired for a Kendo UI Widget.
                                widget.bind("change", function(e) {
                                    if(scope.$root.$$phase === '$apply' || scope.$root.$$phase === '$digest') {
                                        ngModel.$setViewValue(widget.value());
                                    } else {
                                        scope.$apply(function() {
                                            ngModel.$setViewValue(widget.value());
                                        });
                                    }
                                });*/
                            }
                        });
                    }
                };
            };

            return {
                create: create
            };
        }
    ]);

    //create all widget
    // form widget
    //var forms = ["omCalendar","omCombo","omNumberField","omEditor", "omSuggestion", "omFileUpload", "omItemSelector"];
    var safeApply = function(fn){
        var scope = this.scope;
        if(scope.$root.$$phase === '$apply' || scope.$root.$$phase === '$digest') {
            fn.call(this);
        } else {
            scope.$apply(function() {
                fn.call(this);
            });
        }
    }

    var widgets = ["omGrid", "omTree", "omButton", "omButtonbar", "omSlider","omMenu", "omProgressbar","omTooltip"];
    var layouts = ["omTabs","omAccordion","omBorderLayout","omPanel"];
//    var windows = ["omMessageBox","omDialog","omMessageTip"];
    var windows = ["omDialog"];
    //meta has {bindFn[function], option[objct])
    var forms = {
        omCalendar: {
            bind: function (omWidget, widget, scope, ngModel, element, attrs) {
                var options = widget("options");

                var dateFormat = widget("options").dateFormat
                if (!dateFormat) {
                    if (options.showTime) {
                        dateFormat = "yy-mm-dd H:i:s"
                    } else {
                        dateFormat = "yy-mm-dd";
                    }
                }
                ngModel.$render = function () {
                    element.val($.omCalendar.formatDate(ngModel.$viewValue), dateFormat)
                }

            },
            options: {
                onSelect: function (date, event) {
                    var context = this;
                    if (context.ngModel) {
                        safeApply.call(context, (function () {
                            context.ngModel.$setViewValue(date)
                        }))
                    }
                }
            }
        },
        omCombo: {
            bind: function (omWidget, widget, scope, ngModel, element, attrs) {
                ngModel.$render = function () {
                    widget("value", ngModel.$viewValue);
                };
            },
            options: {
                onValueChange: function (target, newValue, oldValue, event) {
                    var context = this;
                    if (this.ngModel) {
                        var setVal = function () {
                            context.ngModel.$setViewValue(newValue);
                        };
                        safeApply.call(context, setVal);
                    }

                }
            }
        },
        omNumberField: {
            bind: function (omWidget, widget, scope, ngModel, element, attrs) {
            },
            optons: {}
        },
        omEditor: {
            bind: function (omWidget, widget, scope, ngModel, element, attrs) {
                ngModel.$render = function () {
                    widget("setData", ngModel.$viewValue);
                };
            },
            options: {
                onKeyUp: function (event) {
                    var context = this;
                    var setVal = function () {
                        context.ngModel.$setViewValue(context.widget("getData"));
                    }
                    safeApply.call(context, setVal);
                }
            }
        },
        omSuggestion: {
            bind: function (omWidget, widget, scope, ngModel, element, attrs) {
                ngModel.$render = function () {
                    element.val(ngModel.$viewValue);
                }

            },
            options: {
                onSelect: function (text, rowData, index, event) {
                    var context = this;
                    if (context.ngModel) {
                        safeApply.call(context, (function () {
                            context.ngModel.$setViewValue(text)
                        }))
                    }
                }
            }
        },
        omFileUpload: {

        },
        omItemSelector: {
            bind: function (omWidget, widget, scope, ngModel, element, attrs) {
                ngModel.$render = function () {
                    widget("value", ngModel.$viewValue);
                }

//                widget("value", ngModel.$viewValue);
                ngModel.$render();

            },
            options: {
                onItemSelect: function (itemDatas, event) {
                    var context = this;
                    if (context.ngModel) {
                        safeApply.call(context, (function () {
                            context.ngModel.$setViewValue(context.widget("value"))
                        }))
                    }
                },
                onItemDeselect: function (itemDatas, event) {
                    var context = this;
                    if (context.ngModel) {
                        safeApply.call(context, (function () {
                            context.ngModel.$setViewValue(context.widget("value"))
                        }))
                    }
                },
                onSuccess: function(data, textStatus, event){
                    var context = this;
                    if (context.ngModel) {
                        safeApply.call(context, (function () {
                            context.ngModel.$setViewValue(context.widget("value"))
                            data.concat(context.ngModel.$viewValue)
                        }))
                    }
                }
            }

        }
    }
    // loop through all the widgets and create a directive
    angular.forEach(forms, function (metaData, widget) {
        angular.module('om.directives').directive(widget, ['directiveFactory',
            function (directiveFactory) {
                return directiveFactory.create(widget, metaData);
            }
        ]);
    });

    // loop through all the widgets and create a directive
    angular.forEach([].concat(widgets,layouts, windows), function (widget) {
        angular.module('om.directives').directive(widget, ['directiveFactory',
            function (directiveFactory) {
                return directiveFactory.create(widget);
            }
        ]);
    });

    if ( typeof define === "function" ) {
        define(function (require, exports, module) {
            module.exports = {
                init: function () {
                    angular.bootstrap(document.body, ['om.directives'])
                },
                name: "om.directives",
                module:angularOm
            }
        })
    }

  }(angular));