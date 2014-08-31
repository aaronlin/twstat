(function(){
  $(document).ready(function(){
    var twstat, loadpx, raw, features;
    twstat = (function(){
      twstat.displayName = 'twstat';
      var prototype = twstat.prototype, constructor = twstat;
      function twstat(data){
        this.px = new Px(data);
        this.data = this.px.data;
        this.index = this.px.metadata.VALUES["指標"].map(function(it){
          return it.trim();
        });
        this.year = this.px.metadata.VALUES["期間"];
        this.county = this.px.metadata.VALUES["縣市"];
        this.tableSize = (this.year.length - 1) * this.county.length;
        console.log(this.px.codes('指標'));
      }
      prototype.get = function(indexName, yearName){
        var index, year;
        index = this.px.codes('指標').indexOf(indexName);
        year = this.px.codes('期間').indexOf(yearName);
        console.log('go', index, year);
        if (index <= 0 || year <= 0) {
          return;
        }
        return this.px.dataDict([index, year, '*']);
      };
      return twstat;
    }());
    loadpx = function(k){
      var d;
      d = Q.defer();
      $.ajax("raw/county/" + k).done(function(data){
        return d.resolve(new twstat(data));
      });
      return d.promise;
    };
    raw = Q.defer();
    features = [" 戶籍登記人口數", ' 性比例', ' 30歲人口數', ' 15歲以上未婚人口數', " 1歲人口數", " 50歲人口數", " 65歲以上人口數"];
    loadpx('2.px').then(function(tw2){
      var table, e;
      try {
        console.log('foo');
        table = features.map(function(f){
          var k, ref$, v, results$ = {};
          for (k in ref$ = tw2.get(f, '2011')) {
            v = ref$[k];
if (!/總計|地區/.test(k)) {
              results$[k.trim()] = +v;
            }
          }
          return results$;
        });
      } catch (e$) {
        e = e$;
        console.log(e);
      }
      return raw.resolve(table);
    });
    return raw.promise['catch'](function(it){
      return console.log('catch', it);
    }).then(function(table){
      return loadpx('12.px').then(function(moreData){
        var moreF, more, e, counties, res$, k, countyFeatures, featureCounties, ordered, featuresCor, normalized, distance, maxDistance, rank, cDistance, cor, margin, width, height, x, ff, svg, n, orders, order, doRow, row, column, doRowF, rowF, columnF, doRowFf, rowFf, hcluster, cluster, traverse, tree, elbow, treesvg, nodes, link, node, timeout;
        try {
          moreF = [' 平均每人政府社會福利支出淨額', ' 社區發展媽媽教室班數'];
          console.log('foo');
          more = moreF.map(function(f){
            var k, ref$, v, results$ = {};
            for (k in ref$ = moreData.get(f, '2011')) {
              v = ref$[k];
if (!/總計|地區/.test(k)) {
                results$[k.trim()] = +v;
              }
            }
            return results$;
          });
          console.log('more', more);
          table = table.concat(more);
          features = features.concat(moreF);
        } catch (e$) {
          e = e$;
          console.error(e.stack);
        }
        res$ = [];
        for (k in table[0]) {
          res$.push(k);
        }
        counties = res$;
        countyFeatures = [];
        featureCounties = [];
        try {
          ordered = table.map(function(t, i){
            var sortedCounty, res$, i$, ref$, county, val, len$, c, rank, results$ = [];
            res$ = [];
            for (i$ = 0, len$ = (ref$ = (fn$()).sort(fn1$)).length; i$ < len$; ++i$) {
              county = ref$[i$].county;
              res$.push(county);
            }
            sortedCounty = res$;
            featureCounties[i] == null && (featureCounties[i] = []);
            for (county in t) {
              val = t[county];
              c = counties.indexOf(county);
              featureCounties[i][c] = val;
            }
            for (i$ = 0, len$ = (ref$ = counties).length; i$ < len$; ++i$) {
              county = ref$[i$];
              rank = sortedCounty.indexOf(county);
              c = counties.indexOf(county);
              countyFeatures[c] == null && (countyFeatures[c] = []);
              countyFeatures[c][i] = rank;
              results$.push(rank);
            }
            return results$;
            function fn$(){
              var ref$, results$ = [];
              for (county in ref$ = t) {
                val = ref$[county];
                results$.push({
                  county: county,
                  val: val
                });
              }
              return results$;
            }
            function fn1$(a, b){
              return a.val - b.val;
            }
          });
          featuresCor = featureCounties.map(function(t, i){
            var i$, ref$, len$, f, results$ = [];
            for (i$ = 0, len$ = (ref$ = featureCounties).length; i$ < len$; ++i$) {
              f = ref$[i$];
              results$.push(ss.sample_correlation(t, f));
            }
            return results$;
          });
          console.log(featuresCor);
          normalized = counties.map(function(county){
            var i$, ref$, len$, f, results$ = [];
            for (i$ = 0, len$ = (ref$ = table).length; i$ < len$; ++i$) {
              f = ref$[i$];
              results$.push(f[county]);
            }
            return results$;
          });
          console.log(normalized);
          console.log('ordered', ordered);
          distance = counties.map(function(_, source){
            var i$, ref$, len$, target, results$ = [], fn1$ = curry$(function(x$, y$){
              return x$ + y$;
            });
            for (i$ = 0, len$ = (ref$ = counties).length; i$ < len$; ++i$) {
              target = i$;
              _ = ref$[i$];
              results$.push(Math.sqrt(
              ordered.map(fn$).reduce(fn1$)));
            }
            return results$;
            function fn$(it){
              return Math.pow(it[source] - it[target], 2);
            }
          });
          maxDistance = d3.max(distance.reduce(curry$(function(x$, y$){
            return x$.concat(y$);
          })));
          window.rank = rank = d3.scale.linear().domain([0, counties.length / 2, counties.length]).range(["red", "black", "green"]);
          window.distance = cDistance = d3.scale.linear().domain([0, 1, 2, 3, 4].map((function(it){
            return it * maxDistance / 4;
          }))).range(["blue", "green", "yellow", "orange", "red"]);
          window.cor = cor = d3.scale.linear().domain([-1, 0, 1]).range(["blue", "white", "red"]);
          console.log(maxDistance);
          console.log('distance', distance);
          margin = {
            top: 280,
            right: 0,
            bottom: 150,
            left: 80
          };
          width = 460;
          height = 460;
          x = d3.scale.ordinal().rangeBands([0, width]);
          ff = d3.scale.ordinal().rangeBands([0, 22 * 7]).domain((function(){
            var i$, to$, results$ = [];
            for (i$ = 0, to$ = features.length; i$ < to$; ++i$) {
              results$.push(i$);
            }
            return results$;
          }()));
          console.log(x.rangeBand());
          svg = d3.select('body').append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).style('margin-left', margin.left + 'px').style('overflow', 'visible').append('g').attr('transform', "translate(" + margin.left + "," + margin.top + ")");
          n = counties.length;
          orders = {
            blah: d3.range(n),
            name: d3.range(n).sort(function(a, b){
              return d3.ascending(counties[a], counties[b]);
            }),
            population: ordered[0]
          };
          console.log('ranges', orders);
          /*
          mouseover = (p) ->
            (d3.selectAll '.row text').classed 'active', (d, i) -> i is p.y
            (d3.selectAll '.column text').classed 'active', (d, i) -> i is p.x
          mouseout = -> (d3.selectAll 'text').classed 'active', false
          */
          order = function(value){
            var t;
            x.domain(orders[value]);
            if (value === 'cluster') {
              $('g.tree').show();
            }
            t = svg.transition().duration(2500);
            t.selectAll('.row').attr('transform', function(d, i){
              return "translate(0," + x(i) + ")";
            }).selectAll('.cell').attr('x', function(d, i){
              return x(i);
            });
            t.selectAll('.row-f').attr('transform', function(d, i){
              return "translate(-280," + x(i) + ")";
            });
            return t.selectAll('.column').attr('transform', function(d, i){
              return "translate(" + x(i) + ")rotate(-90)";
            });
          };
          x.domain(orders.name);
          doRow = function(row, i){
            var cell;
            return cell = d3.select(this).selectAll('.cell').data(row).enter().append('rect').attr('class', 'cell').attr('x', function(d, i){
              return x(i);
            }).attr('width', x.rangeBand()).attr('height', x.rangeBand()).style('fill', function(d){
              return cDistance(d);
            });
          };
          svg.append('rect').attr('class', 'background').attr('width', width).attr('height', height);
          row = svg.selectAll('.row').data(distance).enter().append('g').attr('class', 'row').attr('transform', function(d, i){
            return "translate(0," + x(i) + ")";
          }).each(doRow);
          row.append('line').attr('x2', width);
          row.append('text').attr('x', -6).attr('y', x.rangeBand() / 2).attr('dy', '.32em').attr('text-anchor', 'end').text(function(d, i){
            return counties[i];
          });
          column = svg.selectAll('.column').data(distance).enter().append('g').attr('class', 'column').attr('transform', function(d, i){
            return "translate(" + x(i) + ")rotate(-90)";
          });
          column.append('line').attr('x1', -width);
          column.append('text').attr('x', 6).attr('y', x.rangeBand() / 2).attr('dy', '.32em').attr('text-anchor', 'start').text(function(d, i){
            return counties[i];
          });
          doRowF = function(name, i){
            var row, cell;
            row = countyFeatures[i];
            return cell = d3.select(this).selectAll('.cell').data(row).enter().append('rect').attr('class', 'cell').attr('x', function(d, i){
              return x.rangeBand() * i;
            }).attr('width', x.rangeBand()).attr('height', x.rangeBand()).style('fill', function(d){
              return rank(d);
            });
          };
          rowF = svg.selectAll('.row-f').data(counties).enter().append('g').attr('class', 'row-f').attr('transform', function(d, i){
            return "translate(-280," + x(i) + ")";
          }).each(doRowF);
          columnF = svg.selectAll('.column-f').data(features).enter().append('g').attr('class', 'column-f').attr('transform', function(d, i){
            return "translate(" + (i * x.rangeBand() - 280) + ",480)rotate(-90)";
          });
          columnF.append('text').attr('x', 6).attr('y', x.rangeBand() / 2).attr('dy', '.32em').attr('text-anchor', 'end').text(function(d, i){
            return features[i];
          });
          doRowFf = function(row, i){
            var cell;
            console.log('ff', row);
            return cell = d3.select(this).selectAll('.cell').data(row).enter().append('rect').attr('class', 'cell').attr('x', function(d, i){
              return x.rangeBand() * i;
            }).attr('width', x.rangeBand()).attr('height', x.rangeBand()).style('fill', function(d){
              console.log('fill', d, cor(d));
              return cor(d);
            });
          };
          rowFf = svg.selectAll('.row-ff').data(featuresCor).enter().append('g').attr('class', 'row-ff').attr('transform', function(d, i){
            return "translate(-280," + (ff(i) - 200) + ")";
          }).each(doRowFf);
          hcluster = clusterfck.hcluster(distance);
          console.log('clusterfck', hcluster);
          cluster = [];
          traverse = function(t){
            var which, that;
            if (t.value) {
              which = distance.indexOf(t.value);
              cluster.push(which);
              t.which = which;
            }
            if (that = t.left) {
              traverse(that);
            }
            if (that = t.right) {
              return traverse(that);
            }
          };
          traverse(hcluster);
          orders.cluster = cluster;
          tree = d3.layout.tree().separation(function(a, b){
            if (a.parent === b.parent) {
              return 1;
            } else {
              return 0.5;
            }
          }).children(function(it){
            var children, that;
            children = [];
            if (that = it.left) {
              children.push(that);
            }
            if (that = it.right) {
              children.push(that);
            }
            return children;
          }).size([height, 300]).sort(function(a, b){
            return a.which - b.which;
          });
          elbow = function(d, i){
            console.log('elbow', d.target);
            return "M" + (500 + 300 - d.source.y) + "," + d.source.x + "H" + (500 + 300 - (d.target.right || d.target.left ? d.target.y : 300)) + "V" + d.target.x;
          };
          treesvg = svg.append('g');
          treesvg.attr('class', 'tree');
          nodes = tree.nodes(hcluster);
          console.log(nodes);
          link = treesvg.selectAll(".link").data(tree.links(nodes)).enter().append("path").attr("class", "link").attr("d", elbow);
          node = treesvg.selectAll(".node").data(nodes).enter().append("g").attr("class", "node").attr("transform", function(it){
            return "translate(" + (500 + 300 - it.y) + "," + it.x + ")";
          });
          $('g.tree').hide();
          return d3.select('#order').on('change', function(){
            console.log('go', this.value);
            if (timeout) {
              clearTimeout(timeout);
            }
            return order(this.value);
          });
        } catch (e$) {
          e = e$;
          return console.error(e.stack);
        }
      });
    });
  });
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);
