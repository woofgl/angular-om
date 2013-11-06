define(function (require, exports, module) {
    var angularOm = require("angular-om");
    var app = angular.module('app', [angularOm.name]);

    var CalendarCtrl = function ($scope, $element) {
        $scope.defaultDate = new Date(2010, 7, 15);
    }

    app.controller("CalendarCtrl", CalendarCtrl);
    app.controller("ComboCtrl", function($scope, $element){

    });

    module.exports = {
        init: function () {
            angular.bootstrap(document.body, ['app'])
        },
        name: "app",
        module:app
    }

})