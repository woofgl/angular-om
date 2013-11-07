define(function (require, exports, module) {
    var angularOm = require("angular-om");
    var app = angular.module('app', [angularOm.name]);

    var CalendarCtrl = function ($scope, $element) {
        $scope.defaultDate = new Date(2010, 7, 15);
    }

    app.controller("CalendarCtrl", CalendarCtrl);
    app.controller("ComboCtrl", function($scope, $element){
        $scope.options = {
            dataSource : [ {text : '中国', value : 'China/PRC'},
                {text : '美国', value : 'America/USA'},
                {text : '英国', value : 'the United Kingdom/UK'},
                {text : '日本', value : 'Japan/JPN'} ]
        }
/*        $scope.editOptions = {
            onKeyUp: function(event){
                console.log("keyup");
            }
        }*/
    });

    app.controller("SelectorCtrl", function($scope, $element){
        $scope.selectOptions = {
            availableTitle : '可选择省份',
            selectedTitle : '已选择省份',
            dataSource : [
                {text:'北京市',value:'beijing'},{text:'天津市',value:'tianjin'},
                {text:'重庆市',value:'chongqing'},{text:'上海市',value:'shanghai'},
                {text:'河北省',value:'hebei'},{text:'山西省',value:'shanxi'},
                {text:'辽宁省',value:'liaoning'},{text:'吉林省',value:'jilin'},
                {text:'黑龙江省',value:'heilongjiang'},{text:'江苏省',value:'jiangsu'},
                {text:'浙江省',value:'zhejiang'},{text:'安徽省',value:'anhui'},
                {text:'福建省',value:'fujian'},{text:'江西省',value:'jiangxi'},
                {text:'山东省',value:'shandong'},{text:'河南省',value:'henan'},
                {text:'湖北省',value:'hubei'},{text:'湖南省',value:'hunan'},
                {text:'广东省',value:'guangdong'},{text:'海南省',value:'hainan'},
                {text:'四川省',value:'sichuan'},{text:'贵州省',value:'guizhou'},
                {text:'云南省',value:'yunnan'},{text:'陕西省',value:'shaanxi'},
                {text:'甘肃省',value:'gansu'},{text:'青海省',value:'qinghai'}
            ]
        };
        $scope.sf = ['hubei','shaanxi'];
    });

    module.exports = {
        init: function () {
            angular.bootstrap(document.body, ['app'])
        },
        name: "app",
        module:app
    }

})