(function(){
  var slice$ = [].slice;
  $(document).ready(function(){
    var px, twstat, reformat, update;
    px = null;
    twstat = (function(){
      twstat.displayName = 'twstat';
      var prototype = twstat.prototype, constructor = twstat;
      function twstat(data){
        this.px = new Px(data);
        this.data = this.px.data;
        console.log(this.px);
        this.index = ["數據指標"].concat(this.px.metadata.VALUES["指標"].map(function(it){
          return it.trim();
        }));
        this.year = ["數據年份"].concat(this.px.metadata.VALUES["期間"]);
        this.county = this.px.metadata.VALUES["縣市"];
        this.tableSize = (this.year.length - 1) * this.county.length;
      }
      return twstat;
    }());
    reformat = function(v){
      var u;
      u = parseFloat(v);
      if (isNaN(u)) {
        return "N/A";
      }
      if (u < 100) {
        return parseInt(u * 100) / 100;
      }
      u = parseInt(u);
      if (u > 1000000) {
        return parseInt(u / 10000) / 100 + "M";
      }
      if (u > 1000) {
        return parseInt(u / 10) / 100 + "K";
      }
      return u;
    };
    update = function(){
      var index, year, start, end, list, data, res$, i$, ref$, len$, i, n, counties, divs, names, values;
      index = parseInt($('#index-chooser').val());
      year = parseInt($('#year-chooser').val());
      if (index <= 0 || year <= 0) {
        return;
      }
      start = (index - 1) * px.tableSize + px.county.length * (year - 1);
      end = start + px.county.length;
      list = slice$.call(px.data, start, end);
      res$ = [];
      for (i$ = 0, len$ = (ref$ = px.county).length; i$ < len$; ++i$) {
        i = i$;
        n = ref$[i$];
        if (!/總計|地區/.test(n)) {
          res$.push({
            "name": n,
            "value": reformat(list[i])
          });
        }
      }
      data = res$;
      counties = d3.select('#content').selectAll('div.county').data(data);
      divs = counties.enter().append('div').attr('class', 'county');
      names = divs.append('div.county').append('div').attr('class', 'name').text(function(it){
        return it.name + "";
      });
      values = divs.append('div').attr('class', 'value').text(function(it){
        return it.value + "";
      });
      counties.select('div.name').text(function(it){
        return it.name;
      });
      return counties.select('div.value').text(function(it){
        return it.value;
      });
    };
    return d3.json('raw/county/index.json', function(data){
      var pxIndex, keys, res$, k, v;
      pxIndex = data[0];
      res$ = [];
      for (k in pxIndex) {
        res$.push(k);
      }
      keys = res$;
      k = keys[parseInt(Math.random() * keys.length)];
      v = pxIndex[k];
      d3.select('#index-name').text(k + ": " + v);
      return $.ajax("raw/county/" + k).done(function(data){
        px = new twstat(data);
        d3.select('#index-chooser').on('change', update).selectAll('option').data(px.index).enter().append('option').attr('value', function(d, i){
          return i;
        }).text(function(it, i){
          return it + "(" + i + ")";
        });
        return d3.select('#year-chooser').on('change', update).selectAll('option').data(px.year).enter().append('option').attr('value', function(d, i){
          return i;
        }).text(function(it){
          return it;
        });
      });
    });
  });
}).call(this);
