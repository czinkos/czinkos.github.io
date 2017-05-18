// D3 simulation init

var canvas = document.getElementById("graph"),
    context = canvas.getContext("2d"),
    count = 12,
    radius = 80,
    padding = 150

var contentElem = document.getElementById('content');
canvas.width = contentElem.offsetWidth
canvas.height = contentElem.offsetHeight

var width = canvas.width,
    height = canvas.height

var fill = d3.scaleOrdinal(d3.schemeCategory10),
    nodes = []

function tick() {
  draw()
}

function draw() {
  context.clearRect(0, 0, width, height)
  nodes.forEach(drawNode)
}

function drawNode(d) {
  context.beginPath()
  context.moveTo(d.x, d.y)
  context.arc(d.x, d.y, d.radius, 0, 2 * Math.PI, false)
  if (d.fx) {
    context.strokeStyle = fill(d.act)
    context.fillStyle = "white"
    context.lineWidth = 20
    context.stroke()
  } else {
    context.fillStyle = d.color ? d.color : fill(d.act)
    context.strokeStyle = d.color ? d.color : fill(d.act)
  }
  context.fill()
  context.restore()
}

function reheat(dontstop) {
  if (dontstop) {
    simulation.alpha(1).alphaDecay(0).restart()
    return;
  }
  simulation.alpha(1)
    .restart()
}

var simulation = d3.forceSimulation(nodes)
  .on("tick", tick)

// ==========================================
// STEPS
// ==========================================

// canvas
function addPoints() {
  nodes = [
    { x: 200, y: 200, color: fill(1), radius: radius}
  ]
  tick()
}

function addRandomPoints() {
  nodes = d3.range(100).map((d) => {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      color: fill(Math.random() * 10),
      radius: radius
    }
  })
  tick()
}

// d3 
function d3Collision() {
  simulation.nodes(nodes)
  simulation.force('collide',
          d3.forceCollide((d) => d.radius).iterations(3))
  setTimeout(reheat, 3000)
  //reheat()
}

function d3ChargeNodes(v) {
  simulation.force('charge', d3.forceManyBody().strength(-50))
  reheat()
}

function d3PullNodes() {
  simulation.force('pull', d3.forceManyBody().strength(120))
  reheat()
}

function d3Activities() {
  simulation.force('charge', null)
  simulation.force('pull', null)
  nodes = d3.range(6).map((i) => {
    return {
      y: 300,
      x: i * width / 6 + width / 12,
      act: i,
      radius: radius
    }
  })
  simulation.nodes(nodes)
  reheat()
}

function d3ActivitiesMove() {
  nodes.forEach((d) => d.y = height - d.radius)
  tick()
}

function d3ActivitiesMoveBack() {
  simulation.force('x', d3.forceX().x((d) => d.x).strength(0.04))
  simulation.force('y', d3.forceY().y((d) => 300).strength(0.04))
  reheat()
}


var damping = 0.9999,
    grav = 0.8,
    vy

function d3Gravity() {
  simulation.force('y', null)
  vy = d3.range(nodes.length).map(() => 5 + Math.random() * 10)
  simulation.force('gravity', (alpha) => {
    nodes.forEach((node, i) => {
      if (node.y + radius >= canvas.height) {
        vy[i] = -vy[i] * damping
        node.vy = vy[i];
        node.y = canvas.height - radius;
      } else if (node.y - radius <= 0) {
        vy[i] = -vy[i] * damping;
        node.vy = vy[i]
        node.y = radius;
      }
      vy[i] += grav
      node.vy = vy[i];
    })
  })
  reheat(true)
}

function d3MoveToCenter() {
  simulation.force('gravity', null)
  simulation.force('charge', null)
  simulation.force('x', d3.forceX().x(width / 2).strength(0.04))
  simulation.force('y', d3.forceY().y(height / 2).strength(0.04))
  reheat()
}

function getActCenter(act) {
  var actCenter = [
    [padding, padding],
    [width / 2, padding],
    [width - padding, padding],
    [width - padding, height - padding],
    [width / 2, height - padding],
    [padding, height - padding]
  ]
  return {
    x: actCenter[act][0],
    y: actCenter[act][1]
  }
}

function d3AddActNodes() {
  var actNodes = d3.range(6).map((i) => {
    return {
      fx: getActCenter(i).x,
      fy: getActCenter(i).y,
      act: i,
      radius: radius / 2
    }
  })
  nodes = nodes.concat(actNodes)
  simulation.nodes(nodes)
  reheat()
}

function d3MoveNodesToAct() {
  simulation.force('x', d3.forceX().x((d) => getActCenter(d.act).x).strength(0.02))
  simulation.force('y', d3.forceY().y((d) => getActCenter(d.act).y).strength(0.02))
  reheat()
}

function d3SplitNodes() {
  var newNodes = []
  nodes.forEach((d) => {
    if (d.fx) {
      d3.range(40).forEach((i) => {
        newNodes.push({
          x: d.x + (Math.random() * 2 - 1) * radius,
          y: d.y + (Math.random() * 2 - 1) * radius,
          radius: radius / 4,
          act: d.act
        })
      })
      newNodes.push(d)
    }
  })
  nodes = newNodes
  simulation.nodes(nodes)
  reheat()
}

function changeAct() {
  nodes.forEach((d) => {
    if (!d.fx) d.act = Math.floor(Math.random() * 6)
  })
  simulation.nodes(nodes)
  reheat()
}

function repeat(fn) {
  fn()
  setTimeout(function() {
    repeat(fn)
  }, 5000);
}

function d3StartAnim() {
  repeat(changeAct)
}

// ===================================================