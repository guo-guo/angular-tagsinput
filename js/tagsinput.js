
angular.module('services', [])
.service('client', function(){
  var self = this;
});

var tagsModule = angular.module('custom-tagsinput', ['services']);
tagsModule.controller('tagsinputController', ['$scope', 'client', function ($scope, client) {
  $scope.pos = '';
  $scope.enterEvent = true;
  $scope.query = client;
  // 初始化试例
  $scope.query.querySearch = "concept:skinvitals[brand] NOT (concept:skinvitals[brand] NEAR/10 (happyface OR happy)) OR (concept:skinvitals[brand] NEAR/15)";
  }]);

tagsModule.directive('customtags', function() {
    return {
        restrict: 'A',
        require: '?ngModel',
        // scope: {},
        link: function(scope, element, attrs, ngModel) {
          //指定中间转换的字符串和转换所用的正则
          var middleware = 'concept:';
          var recontent = "(" + middleware + ")(.+?\\[\\w+\\])";
          var middre = new RegExp(recontent, "gi");
          var elt = element;
          elt.attr('contenteditable','true');
          elt.attr('role','textbox');
          //指定本地typeahead列表，还可以使用prefetch指定文件，或者使用remote进行实时查询
          var local_brand = ['Etam[brand]', 'Etam[other]', 'H&M[brand]', 'H&M[other]', 'ONLY[brand]', 'ONLY[other]', 'GAP[brand]', 'GAP[other]', 'Aimer[brand]', 'Aimer[other]', 'UNIQLO[brand]', 'VEROMODA[brand]', 'PEACH JOHN[brand]', 'Eland[brand]', 'Teenie Weenie[brand]', 'Ochirly[brand]', 'Five Plus[brand]', 'Jack Jones[brand]', 'Zara[brand]','Basic House[brand]', 'La Chapelle[brand]', 'Esprit[brand]', 'skinvitals[brand]']
          // var typeaheadValue = elt.typeahead({prefetch: "assets/citynames.json"})
          // var typeaheadValue = elt.typeahead({remote:  'http://127.0.0.1/concept?query=%QUERY', limit:10});
          var typeaheadValue = elt.typeahead({local: local_brand, limit:10});
          typeaheadValue.bind('typeahead:selected', $.proxy(function (obj, datum) {
            //选择提示下拉框中内容后，进行的操作
            var focusdata = scope.pos[3];
            var v = obj.currentTarget.value.replace(datum.value, middleware+datum.value);
            var fus = focusdata.slice(0, scope.pos[1]);
              if (scope.pos[2] == -1) 
                  var query = fus + v;
              else
                  var query = fus + v + focusdata.slice(scope.pos[2]);

            var val = itemValue();
            for (var i=0; i<val.length; i++){
                if (val[i].replace(/\s/g, ' ') == focusdata.replace(/\s/g, ' ')){
                  val[i] = query;
                  break;}
              }
            elt.html(spantext(val.join('')));

            this.typeahead('setQuery', '');
            //进行数据绑定
            scope.$parent.$apply(read);
            selectRange(element);
            event.stopPropagation();
            scope.enterEvent = false;
            return false;
            }, elt));

          spantext = function (text) {
	    //对内容进行替换，将匹配到的内容替换成tags
            if (!text) return '';
            return text.replace(/\s/g, '&nbsp;').replace(middre, 
              "<input type='button' style='opacity:1;' brandname='$1$2' value='$2' \
               disabled='disabled' class=' btn btn-xs btn-info clumps '/>" )
          };

          selectRange = function(element){
            //将光标移动至输入框最后
            var selection= window.getSelection ? window.getSelection() : document.selection;
            var range = document.createRange();
            range.selectNodeContents(element[0]);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          };

          getRealLen = function( str ) {  
            return str.replace(/[^\x00-\xff]/g, '__').length; //这个把所有双字节的都给匹配进去了  
          };

          element.on('paste', function(){
            //将内容粘贴到输入框的时候，去掉标签
            setTimeout(function(){
                var val = scope.$parent.$apply(read);
                element.html(spantext(val.join('')));
                selectRange(element);
            },1)
          });

          element.on('click', function(){
            element.typeahead('setQuery', '');
          });

          element.on('keydown', function(){
            //回车的时候进行查询
            if (event.which===13 && scope.enterEvent) {
              // 当按回车时，如果不是在下拉列表中，进行查询。
              // scope.query.update && scope.query.update(['expression', 'includes', 'excludes'], []);
              return false;}
            scope.enterEvent = true;
          });

          element.on('keyup change', function() {
            if ([40, 38].indexOf(event.which)>=0) return true; 
            var val = scope.$parent.$apply(read);
            scope.pos = selectQuery();
            if (!scope.pos){
              element.typeahead('setQuery', '');
              return true;
            }
            //进行查询返回结果进行提示框显示
            element.typeahead('setQuery', scope.pos?scope.pos[0].trim():'');
            var index = 0;
            for (var i=0; i<val.length; i++){
              if (val[i].replace(/\s/g, ' ') == scope.pos[3]){
                index = i;
                break
            }}
            //调整提示框的位置
            if (element.height()<50){
              var pos = getRealLen(val.splice(0, index).join('').replace('concept:', '  ')) + 
                getRealLen(scope.pos[3].substr(0,scope.pos[1]));
              element.siblings('.tt-dropdown-menu').css({left:(pos*4.5>element.width()?element.width()-150:pos*4.5)+'px'});
            }
           });

          ngModel.$render = function() {
            //进行渲染
              element.html(spantext(ngModel.$viewValue) || '');
            };

          function selectQuery(focusValue, pre){
            //以空格为间隔 获取光标所在位置 返回的是以空格为间隔输入框现在光标位置 还有内容
            //例如当前输入框为test1 test2 test3 光标在第二个t后面 
            //将返回['test1', 6, 12, 'test1 test2 test3', 7]
            //当前光标在的内容，上一个空格的位置，下一个空格的位置，整个内容，当前光标所在位置
              if (!pre) pre=0;
              var selection= window.getSelection ? window.getSelection() : document.selection;
              if (!focusValue) var focusValue = selection.focusNode.nodeValue && selection.focusNode.nodeValue.replace(/\s/g, ' ');
              if (!focusValue) return false;
              var currt = selection.focusOffset;
              var next = focusValue.indexOf(' ', pre);
              if (next === -1) return [focusValue.slice(pre), pre, next, focusValue, currt]; 
              if (next < currt) return selectQuery(focusValue, next+1);
              else return [focusValue.slice(pre, next), pre, next, focusValue, currt];
          };

          function itemValue(){
            //获取输入框里的内容。
            return $.map(element.contents(), function(content){
              return $(content).attr('brandname') ? $(content).attr('brandname') : content.textContent;
            });
          };

          function read(){
            //设置ngModel的值，进行双向数据绑定
            var val = itemValue();
            ngModel.$setViewValue(val.join('').replace(/\s/g, ' '));
            return val
          };
          // read();
        }
    };
});
