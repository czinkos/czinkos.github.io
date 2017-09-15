"use strict";

var svg = d3.select("#chart"),
    svgDiv = d3.select("#chartContainer").node(),
    color = d3.scaleOrdinal(d3.schemeCategory10),

//.range(["#333", "#888", "#ccc"]),
keys = ["to14", "between1564", "from65"],
    label = {
  to14: "15 évesnél fiatalabbak",
  between1564: "15-64 évesek",
  from65: "65 éves és annál idősebbek",
  sum: "Összesen",
  age_index: "Öregedési index"
},
    nextButton = d3.select("#nextButton");

var loadData = void 0,
    yAxis = void 0,
    yAxisRight = void 0,
    xAxis = void 0,
    line = void 0,
    lineAge = void 0,
    legend = void 0,
    nextFn = void 0;

nextButton.node().disabled = true;
nextButton.on("click", function () {
  this.disabled = true;nextFn();
});

var formatPerson = function formatPerson(d) {
  return d3.formatLocale({
    "decimal": ",",
    "thousands": "\xA0",
    "grouping": [3],
    "currency": ["", "\xA0Ft"]
  }).format(",")(d) + "\xA0f\u0151";
};
var formatPercent = function formatPercent(d) {
  return d + "%";
};

app("data/data.tsv");

// =====
// steps
// =====

function first(data) {
  xAxis(data);
  yAxis("millió fő", data, "sum");
  var stackData = d3.stack().keys(keys)(data),
      percentData = createPercentData(data),
      percentStackData = d3.stack().keys(keys)(percentData);

  var addCategory = function addCategory(category) {
    return category.forEach(function (e) {
      return e.category = category.key;
    });
  };
  stackData.forEach(addCategory);
  percentStackData.forEach(addCategory);

  to14();

  function to14() {
    showText("A gyermekkorúak száma 2016-ban volt a legalacsonyabb az 1870. évi, első népszámlálás óta. Az 1910-ben több mint 2,5 millió, de a II. világháborút követően is közel 2 millió 300 ezer volt a 15 évesnél fiatalabbak létszáma. Az 1950-es évek népesedéspolitikai intézkedéseit követően 1960-ra újra 2,5 millió fölé emelkedett a gyermekkorúak száma. A születések számának 1980 óta tartó csökkenése következtében 2016-ban a számuk nem érte el az 1,5 milliót.   ");
    legend(["to14"]);

    loadData(stackData.slice(0, 1), function () {
      return waitForNext(between1564);
    }, formatPerson, true);
  }

  function between1564() {
    showText("Az aktív korúak létszáma 1870 óta megkétszereződött. Az 1970. évi népszámláláskor közel 7 millió 15–64 éves személy élt az országban. A korcsoport létszáma azóta csökken, 2016-ban 6,6 millió volt.");
    legend(["to14", "between1564"]);
    loadData(stackData.slice(0, 2), function () {
      return waitForNext(from65);
    }, formatPerson, true);
  }

  function from65() {
    showText("Az időskorúak száma 1870-ben 144 ezer fő volt, a várható élettartam emelkedésével azóta folyamatosan nő. A 65 éves és idősebbek száma 2016-ban megközelítette az 1,8 milliót.");
    legend(["to14", "between1564", "from65"]);
    loadData(stackData.slice(0, 3), function () {
      return waitForNext(sumLine);
    }, formatPerson, true);
  }

  function sumLine() {
    showText("Magyarország népessége 1870 óta megkétszereződött. A II. világháború idején a népességszám visszaesett, azonban az ötvenes években a jelentősen növekedő születések számának köszönhetően az 1970-es népszámlálás már több, mint 10 millió lakost számolt meg. A népességszám 1980-ban tetőzött, azóta újra csökken. 2016-ban 9,8 millióan éltünk Magyarországon.");
    legend(["to14", "between1564", "from65", "sum"]);
    var t = d3.transition().duration(1500).on("end", function () {
      return waitForNext(to100percent);
    });

    d3.selectAll(".category").transition(t).style("opacity", 0.2);

    line(data, "sum", t, false);
  }

  function to100percent() {
    legend(["to14", "between1564", "from65"]);
    var t = d3.transition().duration(1500);

    d3.select("#sumLine").transition(t).style("opacity", 0).remove();

    d3.selectAll(".category").transition(t).style("opacity", 1);

    showText("A gyermekkorúak aránya 2016-ban volt a legalacsonyabb az 1870. évi, első népszámlálás óta. Az 1910-es évekig a népesség több mint 30%-a 15 évesnél fiatalabb volt, míg 2016-ban a 15%-ot sem érte el. Az aktív korúak aránya a közel 150 év alatt kismértékben, 60-ról 67%-ra nőtt. Jelentős volt azonban a növekedés az időskorúak arányában: a 65 éves és idősebbek aránya 1970-ig 10% alatti volt, 2016-ra 19%-ra emelkedett.");
    yAxis("%", percentData, "sum", true);
    loadData(percentStackData, function () {
      return waitForNext(ageIndex);
    }, formatPercent, false);
  }

  function ageIndex() {
    showText("Az öregedési index azt mutatja, hogy hány időskorú személy jut 100 gyermekkorúra (száz 0–14 évesre jutó 65 éves és idősebb). A népesség idősödő korszerkezetét mutatja a mutató meredeken felfelé ívelő görbéje. 1870-ben száz gyermekre még csak 8 idős ember jutott, 2016-ban már 128.");
    legend(["to14", "between1564", "from65", "age_index"]);

    yAxisRight(data, "age_index");
    //loadData(percentStackData, () => false, formatPercent, false)
    d3.selectAll(".category").transition().duration(1500).style("opacity", 0.3).on("end", function () {
      return lineAge(data, "age_index", d3.transition().duration(3000).ease(d3.easeLinear), true);
    } // true -> draw line
    );
  }
}

function showText(text) {
  var t = d3.select("#text > p");
  t.transition().duration(500).style("opacity", "0").on("end", function () {
    return t.text(text);
  }).transition().duration(1000).style("opacity", 1);
}

function waitForNext(fn) {
  nextFn = fn;
  nextButton.node().disabled = false;
}

// =============================
// app
// =============================

function app(url) {
  setSize();
  var queue = d3.queue();
  queue.defer(d3.tsv, url).await(start);
}

function start(error, data, s) {
  if (error) {
    alert("Hiba történt!");return;
  }

  var margin = { top: 40, left: 40 },
      width = +svg.attr("width") - margin.left * 2,
      height = +svg.attr("height") - margin.top * 2,
      g = svg.append("g").attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

  var x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.35).paddingOuter(0.1);

  var y = d3.scaleLinear().rangeRound([height, 0]),
      yR = d3.scaleLinear().rangeRound([height, 0]);

  xAxis = function xAxis(data) {
    return drawXAxis(data, g, x, height);
  };
  yAxis = function yAxis(label, data, key, percent) {
    return drawYAxis(label, data, key, g, y, 0, false, percent);
  };
  yAxisRight = function yAxisRight(data, key) {
    return drawYAxis("fő", data, key, g, yR, width, true, true);
  };

  color.domain(keys.concat(["sum", "age_index"]));
  loadData = createLoadData(g.append("g"), x, y, width, height);
  line = function line(data, key, transition, draw) {
    return drawLine(data, key, transition, g.append("g"), x, y, height, draw);
  };
  lineAge = function lineAge(data, key, transition, draw) {
    return drawLine(data, key, transition, g.append("g"), x, yR, height, draw);
  };

  legend = function legend(data, transition) {
    return drawLegend(data, transition);
  };

  first(data);
}

function createPercentData(data) {
  return data.map(function (e) {
    var to14 = Math.round(100 * e.to14 / e.sum),
        between1564 = Math.round(100 * e.between1564 / e.sum),
        from65 = 100 - (to14 + between1564);

    var objs = [e, { to14: to14, between1564: between1564, from65: from65, sum: 100 }];
    return objs.reduce(function (r, o) {
      Object.keys(o).forEach(function (k) {
        r[k] = o[k];
      });
      return r;
    }, {});
  });
}

function drawLegend(data, transition) {

  var legend = d3.select("#legend").selectAll("div").data(data);

  var legendE = legend.enter().append("div").attr("class", "legend").append("table").append("tr");

  legendE.append("td").attr("opacity", 0).attr("class", function (d) {
    return "legend-rect rect-" + d;
  }).style("background-color", color).transition(transition).style("opacity", 1);

  legendE.append("td").style("opacity", 0).attr("class", function (d) {
    return "label label-" + d;
  }).text(function (d) {
    return label[d];
  }).transition(transition).style("opacity", 1);

  legend.exit().remove();
}

function drawXAxis(data, g, x, height) {
  x.domain(data.map(function (d) {
    return d.year;
  }));
  g.append("g").attr("id", "axis-x").attr("class", "axis").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x).tickSize(0).tickPadding(7));
}

function drawYAxis(label, data, key, g, y, xPosition) {
  var rightAxis = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
  var percent = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;

  y.domain([0, d3.max(data, function (d) {
    return +d[key];
  })]).nice();
  var axis = rightAxis ? d3.axisRight(y) : d3.axisLeft(y);
  if (percent) {
    axis.tickFormat(function (d) {
      return d;
    });
  } else {
    axis.tickFormat(function (d) {
      return d / 1e6;
    });
  }
  var id = "axis-y" + (rightAxis ? "right" : "");
  d3.select("#" + id).remove();
  g.append("g").attr("id", id).attr("class", "axis-y axis").attr("transform", "translate(" + xPosition + ",0)").call(axis).append("text").attr("class", "label").attr("x", 12).attr("y", y(y.ticks().pop()) + 0.5).attr("dy", "-1.50em").attr("fill", "#000").attr("font-weight", "bold").attr("text-anchor", "end").text(label);
}

function createLoadData(g, x, y, width, height) {
  return function (data, callback, format, delay) {
    var t = d3.transition().duration(1500).ease(d3.easeCircleOut).on("end", callback);

    var tooltip = d3.select("#tooltip");

    var categories = g.selectAll("g").data(data, function (d) {
      return d.key;
    });

    var categoriesE = categories.enter();
    var categoriesM = categoriesE.append("g").merge(categories).attr("class", "category");

    var rects = categoriesM.selectAll("rect").data(function (d) {
      return d;
    }, function (d) {
      return d.data.year + ":" + d.key;
    });

    var rectsE = rects.enter();

    var rectM = rectsE.append("rect").attr("class", function (d) {
      return "year" + d.data.year;
    }).attr("x", function (d) {
      return x(d.data.year);
    }).attr("y", function (d) {
      return y(d[0]);
    }).attr("height", 0).style("fill", function (d) {
      return color(d.category);
    }).on("mouseover", function (d) {
      tooltip.style("display", "block");
      tooltip.selectAll("tr").remove();
      d3.selectAll(".year" + d.data.year).each(function (d) {
        var tr = tooltip.insert("tr", ":first-child");
        tr.append("td").attr("class", "rect").style("background-color", color(d.category));
        tr.append("td").attr("class", "text").html(format(d.data[d.category]));
      });
    }).on("mouseout", function () {
      return tooltip.style("display", "none");
    }).on("mousemove", function (d) {
      var xPosition = d3.mouse(this)[0] - 20,
          yPosition = d3.mouse(this)[1] + 70,
          offsetX = xPosition > width / 2 ? -130 : 0,
          offsetY = yPosition > height / 2 ? -220 : 0;

      tooltip.style("left", xPosition + offsetX + "px");
      tooltip.style("top", yPosition + offsetY + "px");
    }).merge(rects).on("mouseover", function (d) {
      tooltip.style("display", "block");
      tooltip.selectAll("tr,p").remove();
      d3.selectAll(".year" + d.data.year).each(function (d) {
        var tr = tooltip.insert("tr", ":first-child");
        tr.append("td").attr("class", "label").style("color", color(d.category)).text(label[d.category] + ":");
        tr.append("td").attr("class", "text").html(format(d.data[d.category]));
      });
      tooltip.insert("p", ":first-child").attr("class", "title").text(d.data.year);
      var sumTr = tooltip.append("tr");
      sumTr.append("td").style("color", color("sum")).text("Összesen:");
      sumTr.append("td").attr("class", "text").text(format(d.data.sum));
      var ageTr = tooltip.append("tr");
      ageTr.append("td").attr("class", "label").style("color", color("age_index")).text("Öregedési index:");
      ageTr.append("td").attr("class", "text").text(formatPerson(d.data.age_index));
    });

    rectM.transition(t).delay(delay ? function (d, i) {
      return i * 50;
    } : 0).attr("y", function (d) {
      return y(d[1]);
    }).attr("height", function (d) {
      return y(d[0]) - y(d[1]);
    }).attr("width", x.bandwidth()).style("fill", function (d) {
      return color(d.category);
    }).style("opacity", 1);

    categories.exit().transition(t).style("opacity", 0).remove();
  };
}

function drawLine(data, key, transition, g, x, y, height) {
  var draw = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;

  var line = d3.line().x(function (d) {
    return x(d.year);
  }).y(function (d) {
    return y(d[key]);
  });

  var path = g.append("path").datum(data);

  path.attr("id", "sumLine").attr("fill", "none").attr("stroke", color(key)).attr("stroke-linejoin", "round").attr("stroke-linecap", "round").attr("stroke-width", 5).attr("transform", "translate(" + x.bandwidth() / 2 + ", 0)").attr("d", line);

  if (draw) {
    path.attr("stroke-dasharray", function (d) {
      return this.getTotalLength();
    }).attr("stroke-dashoffset", function (d) {
      return this.getTotalLength();
    }).transition(transition).attr("stroke-dashoffset", 0);
  } else {
    path.style("opacity", 0).transition(transition).style("opacity", 1);
  }
}

// ==============================
function setSize() {
  svg.attr("width", svgDiv.offsetWidth).attr("height", svgDiv.offsetHeight);
}
