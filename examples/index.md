# 日历控件

---
### import
````html
<link rel="stylesheet" href="../css/apusic/om-apusic.css">
<script src="../js/jquery.min.js"></script>
<script src="../js/operamasks-ui.min.js"></script>
<script src="../sea-modules/angular/angularjs/1.1.5/angular.js"></script>
<script src="../sea-modules/seajs/seajs/2.1.1/sea.js"  id="seajsnode"></script>
````

### 日历控件
````html
<div ng-controller="CalendarCtrl">
<h4>基本功能</h4>
<input om-calendar >
<h4>默认日期</h4>
<input o-date="defaultDate" om-calendar o-read-only="true" >

<input o-date="javascript:new Date(2010, 11, 15)" om-calendar >
<h4>数据绑定</h4>
<input ng-model="bind" om-calendar >
{{bind}}
<h4>expose</h4>
<input ng-model="bind1" om-calendar="omCal" >
{{bind1}}

<h4>not popup</h4>
<div o-popup="false" om-calendar ></div>

</div>
````


````javascript
seajs.use('./app', function(app){
    console.log(app);
    app.init();
});
````
