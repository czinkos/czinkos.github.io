"use strict";

// ==========================
// load data
// ==========================
var currentQuestion = 0,
    selectedValue = 0,
    selectedCountry = void 0,
    selectedSex = Math.random() > 0.5 ? "F" : "M";

var queue = d3.queue();
queue.defer(d3.json, "data/50m.json").defer(d3.tsv, "data/iso-country.tsv").defer(d3.tsv, "data/people.tsv").defer(d3.tsv, "data/data.tsv").defer(d3.tsv, "data/questions.tsv").await(app);

var countryByCode = void 0,
    countryByNumericCode = void 0,
    drawChart = void 0,
    dataAll = void 0,
    getImgUrl = void 0;

function app(error, topology, countryNames, people, data, questions) {
  dataAll = data;
  countryByCode = countryNames.reduce(function (acc, e) {
    return acc[e.Alpha_2_code] = e, acc;
  }, {});
  countryByNumericCode = countryNames.reduce(function (acc, e) {
    return acc[e.Numeric_code] = e, acc;
  }, {});

  data.forEach(function (e) {
    if (!countryByCode[e.country]) return;
    e.numericCode = countryByCode[e.country].Numeric_code;
    e.countryName = countryByCode[e.country].ENGLISH_NAME;
  });
  var mapData = data.reduce(function (acc, e) {
    if (!acc[e.numericCode]) acc[e.numericCode] = {};
    acc[e.numericCode][e.sex] = e;
    return acc;
  }, {});

  var a = data.filter(function (d) {
    return d['1'] && d['2'] && d['3'] && d['4'] && d['5'];
  });
  selectedCountry = a[Math.floor(Math.random() * a.length)].country;
  d3.select("#countryName").text((selectedSex == "M" ? "Male in " : "Female in ") + countryByCode[selectedCountry].ENGLISH_NAME);
  drawMap(topology, mapData);

  drawChart = createChart();

  getImgUrl = function getImgUrl() {
    return "img/" + people.filter(function (e) {
      return e.country == selectedCountry && e.sex == selectedSex;
    })[0].imageFile;
  };

  drawQuestion(questions);
}

// ==========================
// questions
// ==========================
function drawQuestion(questions) {
  d3.select('#nextButton').on('click', function () {
    return nextQuestion(currentQuestion < questions.length - 1 ? currentQuestion + 1 : 0);
  });

  d3.select("#gamePanel").append("img").attr("id", "player").style('position', 'absolute').style('bottom', '20px').style('left', '100px').attr('src', getImgUrl(selectedCountry, selectedSex)).attr('alt', 'your guess');

  d3.select("#gamePanel").append("img").attr("id", "reality").style("opacity", 0.3).style('position', 'absolute').style('bottom', '20px').style('left', '500px').attr('src', getImgUrl(selectedCountry, selectedSex)).attr('alt', 'reality');

  function nextQuestion(i) {
    if (i == questions.length) window.location = '';
    currentQuestion = i;
    d3.select('#question').text(questions[i].question);
    range();
    d3.select('#nextButton').on('click', function () {
      return false;
    });
    d3.select("#notes").html("");
    selectedValue = 0;
    createChart()([]);
  }

  function range() {
    var r = d3.select('#range'),
        classes = d3.range(10).map(function (d) {
      return 'dec-' + d;
    });
    r.selectAll('div').remove();
    r.selectAll('div').data(d3.range(10)).enter().append('div').attr('class', function (d) {
      var x = 'dec ' + classes.join(' ');classes.shift();return x;
    }).style('background-color', '#333').on('mouseenter', function (d) {
      !selectedValue && d3.selectAll('#range .dec-' + d).style('background-color', 'white');
    }).on('mouseleave', function () {
      return !selectedValue && d3.selectAll('#range div').style('background-color', '#333');
    }).on('click', function (d) {
      selectedValue = ++d;
      var realValue = 0;
      var a = dataAll.filter(function (d) {
        return d.sex == selectedSex && d[currentQuestion + 1];
      }).map(function (d) {
        var value = d[currentQuestion + 1] != "" ? +d[currentQuestion + 1] * 10 : 0;
        if (d.country == selectedCountry) {
          realValue = value;
        }
        return {
          country: d.country,
          value: value
        };
      });

      d3.select('#nextButton').on('click', function () {
        return nextQuestion(currentQuestion + 1);
      });
      createChart()(a);
      var t = d3.transition().duration(2000).ease(d3.easeElasticOut).on('end', function () {
        d3.select("#notes").html("<b style='font-size: 120%'>" + questions[currentQuestion].indicator + "</b> " + questions[currentQuestion].note);
      });

      d3.select("#player").transition(t).style("bottom", currentQuestion * 120 + selectedValue / 10 * 120 + "px");
      d3.select("#reality").transition(t).style("bottom", currentQuestion * 120 + realValue / 100 * 120 + "px");
    });
  }

  nextQuestion(0);
}

// ===========================
// map
// ===========================

function drawMap(topology, data) {
  var width = 1000,
      height = 600;
  var centered = void 0,
      clicked_point = void 0;

  var projection = d3.geoMercator().translate([width / 2.2, height / 1.5]).scale(150);

  var svg = d3.select("#map").append("svg").attr("width", width).attr("height", height).attr("class", "map");

  var g = svg.append("g"),
      path = d3.geoPath().projection(projection);

  var countries = topojson.feature(topology, topology.objects.countries).features;
  countries.forEach(function (d) {
    return d.data = data[d.id];
  });

  g.selectAll("path").data(countries).enter().append("path").attr("d", path).attr("class", function (d) {
    return d.data ? d.data[selectedSex].country : '';
  }).style("fill", function (d) {
    return d.data && selectedCountry == d.data[selectedSex].country ? "white" : "#766";
  }).on('mouseenter', function (d) {
    if (d.data && selectedCountry == d.data[selectedSex].country) return;
    this.style.fill = 'lightblue';
    d3.selectAll(d.data ? "." + d.data[selectedSex].country : "").style("fill", "lightblue");
  }).on('mouseleave', function (d) {
    if (d.data && selectedCountry == d.data[selectedSex].country) return;
    this.style.fill = '#766';
    d3.selectAll(d.data ? "." + d.data[selectedSex].country : "").style("fill", "#766");
  });
}

function colorMap(i) {
  d3.selectAll("#map svg path").style("fill", function (d) {
    return color(d.data[i]);
  });
}

// =========================
// chart
// =========================

function createChart() {
  d3.select("#chartSvg g").remove();
  var svg = d3.select("#chartSvg").attr("width", 1000).attr("height", 290),
      margin = { top: 20, right: 20, bottom: 30, left: 40 },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x = d3.scaleBand().rangeRound([0, width]).padding(0.4),
      y = d3.scaleLinear().rangeRound([height, 0]);

  g.append("g").attr("class", "axis axis--y").call(d3.axisLeft(y).ticks(10, "%")).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", "0.71em").attr("text-anchor", "end").text("");

  return function (data) {
    data.sort(function (a, b) {
      return b.value - a.value;
    });

    x.domain(data.map(function (d) {
      return d.country;
    }));
    y.domain([0, d3.max(data, function (d) {
      return d.value;
    })]);

    var t = d3.transition().duration(1500);

    var bars = g.selectAll(".bar").data(data, function (d) {
      return d.country;
    });

    bars.exit().transition().duration(1000).attr("height", 0).remove();

    bars.transition(t).attr("height", function (d) {
      return height - y(d.value);
    }).attr("y", function (d) {
      return y(d.value);
    }).attr("x", function (d) {
      return x(d.country);
    });
    bars.enter().append("rect").attr("class", function (d) {
      return "bar " + d.country;
    }).attr("x", function (d) {
      return x(d.country);
    }).attr("y", function (d) {
      return y(0);
    }).style("fill", function (d) {
      return d.country == selectedCountry ? "white" : "#766";
    }).attr("width", x.bandwidth()).on('mouseenter', function (d) {
      if (d.country == selectedCountry) return;
      this.style.fill = "lightblue";
      d3.selectAll("path." + d.country).style("fill", "lightblue");
    }).on('mouseleave', function (d) {
      if (d.country == selectedCountry) return;
      this.style.fill = "#766";
      d3.selectAll("path." + d.country).style("fill", "#766");
    }).on('click', function (d) {
      return alert("Selected " + d.country);
    }).transition(t).attr("height", function (d) {
      return height - y(d.value);
    }).attr("y", function (d) {
      return y(d.value);
    });
  };
}
