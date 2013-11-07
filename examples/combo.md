# 组合输入框

---
### import
````html
<link rel="stylesheet" href="../css/apusic/om-apusic.css">
<script src="../js/jquery.min.js"></script>
<script src="../js/operamasks-ui.min.js"></script>
<script src="../js/editor/omeditor.js"></script>
<script src="../sea-modules/angular/angularjs/1.1.5/angular.js"></script>
<script src="../sea-modules/seajs/seajs/2.1.1/sea.js"  id="seajsnode"></script>
````


````html
<div ng-controller="ComboCtrl">
<h4>基本功能</h4>
<input om-combo o-options="options"/>
<h4>数据绑定</h4>
<input om-combo o-options="options" ng-model="bind"/>{{bind}}
<h4>ajax</h4>
<p>注:当下的url无效</p>
<input om-combo o-data-source="remoteurl" ng-model="bind1"/>
<h3>数字输入框</h3>
 <input om-number-field ng-model="bindNumber"/> {{bindNumber}}
<h3>OMEditor</h3>
 <textarea om-editor ng-model="newtext" class="editor" o-options="editOptions"></textarea>

 <textarea ng-model="newtext"  ></textarea>
<h3>Suggess</h3>
 <h5>需要配置远程服务器</h5>
 <input om-suggestion o-data-source="suggestion.json"/>

</div>
````


````javascript
seajs.use('./app', function(app){
    console.log(app);
    app.init();
});
````
