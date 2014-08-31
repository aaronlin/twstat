<- $ document .ready
class twstat
  (data) ->
    @px = new Px data
    @data = @px.data
    @index = @px.metadata.VALUES["指標"].map (.trim!)
    @year  = @px.metadata.VALUES["期間"]
    @county = @px.metadata.VALUES["縣市"]
    @table-size = (@year.length - 1) * @county.length
    console.log @px.codes('指標')
  get: (index-name, year-name) ->
    index = @px.codes('指標').index-of index-name
    year = @px.codes('期間').index-of year-name
    console.log \go index, year
    if index<=0 or year<=0 then return
    @px.dataDict([index, year, '*'])

loadpx = (k) ->
  d = Q.defer!
  $.ajax "raw/county/#{k}" .done (data) ->
    d.resolve new twstat data
  return d.promise

raw = Q.defer!

features = [" 戶籍登記人口數", ' 性比例', ' 30歲人口數', ' 15歲以上未婚人口數', " 1歲人口數", " 50歲人口數",  " 65歲以上人口數"];
loadpx('2.px')
.then (tw2) ->
  try
    console.log \foo
    table = features.map (f) -> {[k.trim!, +v] for k, v of tw2.get(f, '2011') when k isnt /總計|地區/}
  catch
    console.log e
  raw.resolve table


table <- raw.promise.catch -> console.log \catch it
.then

more-data <- loadpx('12.px')
.then
try
  more-f = [' 平均每人政府社會福利支出淨額', ' 社區發展媽媽教室班數' ]
  console.log \foo
  more = more-f.map (f) -> {[k.trim!, +v] for k, v of more-data.get(f, '2011') when k isnt /總計|地區/}
  console.log \more more
  table ++= more
  features ++= more-f
catch
  console.error e.stack

counties = [k for k of table.0]

county-features = []
feature-counties = []

try
  ordered = table.map (t, i) ->
    sorted-county = [county for {county} in [{county,val} for county, val of t].sort (a, b) -> a.val - b.val]
    feature-counties[i] ?= []
    for county, val of t
      c = counties.index-of county
      feature-counties[i][c] = val
    for county in counties
      rank = sorted-county.index-of county
      c = counties.index-of county
      county-features[c] ?= []
      county-features[c][i] = rank
      rank

  features-cor = feature-counties.map (t, i) ->
    for f in feature-counties
      ss.sample_correlation(t, f)

  console.log features-cor
  normalized = counties.map (county) ->
    for f in table
      f[county]
  console.log normalized
  console.log \ordered ordered
  distance = counties.map (_, source) ->
    for _, target in counties
      ordered.map(-> (it[source] - it[target]) ** 2).reduce (+) |> Math.sqrt
  max-distance = d3.max distance.reduce (++)

  window.rank = rank = d3.scale.linear!domain [0, counties.length / 2, counties.length] .range ["red", "black", "green"]
  window.distance = c-distance = d3.scale.linear!domain [0 to 4].map (* max-distance / 4)
    .range ["blue", "green", "yellow", "orange", "red"]
  window.cor = cor = d3.scale.linear!domain [-1, 0, 1]
    .range ["blue", "white", "red"]

  console.log max-distance

  console.log \distance distance

  margin = do
    top: 280
    right: 0
    bottom: 150
    left: 80

  width = 460
  height = 460
  x = d3.scale.ordinal!rangeBands [0, width]
  ff = d3.scale.ordinal!rangeBands [0, 22*7] .domain [0 til features.length]
  console.log x.rangeBand!

  svg = d3.select 'body' .append 'svg'
  .attr 'width' width + margin.left + margin.right
  .attr 'height' height + margin.top + margin.bottom
  .style 'margin-left', margin.left + 'px'
  .style 'overflow', \visible
  .append 'g' .attr 'transform', "translate(#{margin.left},#{margin.top})"

  n = counties.length
  orders = {
    blah: d3.range n
    name: d3.range n .sort (a, b) -> d3.ascending counties[a], counties[b]
    population: ordered.0
  }
  console.log \ranges orders
  /*
  mouseover = (p) ->
    (d3.selectAll '.row text').classed 'active', (d, i) -> i is p.y
    (d3.selectAll '.column text').classed 'active', (d, i) -> i is p.x
  mouseout = -> (d3.selectAll 'text').classed 'active', false
  */
  order = (value) ->
    x.domain orders[value]
    t = svg.transition!.duration 2500
    t.selectAll '.row'
#      .delay (d, i) -> (x i) * 4
      .attr 'transform', (d, i) -> "translate(0,#{x i})"
      .selectAll '.cell'
#      .delay (d) -> (x d.x) * 4
      .attr 'x', (d, i) -> x i
    t.selectAll '.row-f'
#      .delay (d, i) -> (x i) * 4
      .attr 'transform', (d, i) -> "translate(-280,#{x i})"
    t.selectAll '.column'
#      .delay ((d, i) -> (x i) * 4)
      .attr 'transform', (d, i) -> "translate(#{ x i })rotate(-90)"

  x.domain orders.name
#  sort counties

  do-row = (row, i) ->
    cell = d3.select this .selectAll '.cell'
    .data row#.filter ((d) -> d.z))
    .enter!append 'rect' .attr 'class', 'cell' .attr 'x', (d, i) -> x i #d.x
    .attr 'width' x.rangeBand! .attr 'height', x.rangeBand!
#    .style 'fill-opacity', (d) -> z d.z
    .style 'fill', (d) -> c-distance d
#    .on 'mouseover' mouseover .on 'mouseout' mouseout

  svg.append 'rect' .attr 'class', 'background' .attr 'width', width .attr 'height', height
  row = svg.selectAll '.row' .data distance
    .enter!append 'g' .attr 'class' 'row'
    .attr 'transform' (d, i) -> "translate(0,#{x i})"
    .each do-row
  row.append 'line' .attr 'x2', width
  row.append 'text' .attr 'x', -6 .attr 'y', x.rangeBand! / 2 .attr 'dy', '.32em' .attr 'text-anchor', 'end'
    .text (d, i) -> counties[i]
  column = svg.selectAll '.column' .data distance .enter!append 'g' .attr 'class', 'column'
    .attr 'transform', (d, i) -> "translate(#{x i})rotate(-90)"
  column.append 'line' .attr 'x1', -width
  column.append 'text' .attr 'x', 6 .attr 'y', x.rangeBand! / 2 .attr 'dy', '.32em' .attr 'text-anchor', 'start' .text (d, i) -> counties[i]

  do-row-f = (name, i) ->
    row = county-features[i]
    cell = d3.select this .selectAll '.cell'
    .data row#.filter ((d) -> d.z))
    .enter!append 'rect' .attr 'class', 'cell' .attr 'x', (d, i) -> x.rangeBand! * i
    .attr 'width' x.rangeBand! .attr 'height', x.rangeBand!
#    .style 'fill-opacity', (d) -> z d.z
    .style 'fill', (d) -> rank d
#    .on 'mouseover' mouseover .on 'mouseout' mouseout
  row-f = svg.selectAll '.row-f' .data counties
    .enter!append 'g' .attr 'class' 'row-f'
    .attr 'transform' (d, i) -> "translate(-280,#{x i})"
    .each do-row-f
  column-f = svg.selectAll '.column-f' .data features .enter!append 'g' .attr 'class', 'column-f'
    .attr 'transform', (d, i) -> "translate(#{i * x.rangeBand! - 280},480)rotate(-90)"
  column-f.append 'text' .attr 'x' 6 .attr 'y', x.rangeBand! / 2 .attr 'dy', '.32em'
    .attr 'text-anchor', 'end' .text (d, i) -> features[i]

  do-row-ff = (row, i) ->
    console.log \ff row
    cell = d3.select this .selectAll '.cell'
    .data row#.filter ((d) -> d.z))
    .enter!append 'rect' .attr 'class', 'cell' .attr 'x', (d, i) -> x.rangeBand! * i
    .attr 'width' x.rangeBand! .attr 'height', x.rangeBand!
#    .style 'fill-opacity', (d) -> z d.z
    .style 'fill', (d) -> console.log \fill d, cor d; cor d
#    .on 'mouseover' mouseover .on 'mouseout' mouseout
  console.log \ff features-cor
  row-ff = svg.selectAll '.row-ff' .data features-cor
    .enter!append 'g' .attr 'class' 'row-ff'
    .attr 'transform' (d, i) -> "translate(-280,#{ff(i) - 200})"
    .each do-row-ff
  hcluster = clusterfck.hcluster distance
  console.log \clusterfck  hcluster
  cluster = []
  traverse = (t) ->
    console.log \t t.size
    if t.value
      cluster.push distance.index-of t.value
    if t.left => traverse that
    if t.right => traverse that
  traverse hcluster
  orders.cluster = cluster

  var timeout
  d3.select '#order' .on 'change' ->
    console.log \go @value
    clearTimeout timeout if timeout
    order @value
catch
  console.error e.stack

