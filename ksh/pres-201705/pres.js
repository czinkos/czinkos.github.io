var steps = document.getElementById('steps').querySelectorAll('section')
var elapsedTimeElem = document.getElementById('time_elapsed')

var stepFn = []

var createFn = function(f) {
  return function(prev, current, backwards, leave) {
    if (backwards) {
      if (leave) f(false)
      return;
    }
    removeActive(steps[prev])
    addActive(steps[current])
    f(true)
  }
}

for (var step of steps) {
  var fn = step.getAttribute('data-fn')
  if (fn) {
    stepFn.push(createFn(window[fn]))
  } else {
    stepFn.push(function(prev, current, backwards, leave) {
      if (backwards && leave) return;
      removeActive(steps[prev])
      addActive(steps[current])
    })
  }
}

function addActive(elem) {
  elem.classList.remove('inactive')
  elem.classList.add('active')
}

function removeActive(elem) {
  elem.classList.remove('active')
  elem.classList.add('inactive')
}


function doStep(prev, current) {
  if (prev > current) {  // backwards
    stepFn[prev] (null, prev, true, true)
    stepFn[current](prev, current, true, false)
  }
  stepFn[current](prev, current, false, false)
}

// ============================================

window.onkeyup = function handleKeyUp(event) {
  switch (event.code) {
    case 'ArrowRight':
    case 'Space':
    case 'KeyN':
    case 'PageDown':
      next()
      break
    case 'ArrowLeft':
    case 'PageUp':
    case 'KeyP': prev()
  }
}

window.onmouseup = function handleMouseUp(event) {
  next()
}

var current = 0
var started = false;

function next() {
  if (!started) {
    started = true
    timer(0)
  }
  var prev = current
  if (current  + 1 < stepFn.length) {
    current += 1
    doStep(prev, current)
  }
}

function prev() {
  var prev = current
  if (current - 1 >= 0)
    current -= 1
    doStep(prev, current)
}

steps[0].classList.add('active')

var step = 60 * 1000,
    duration = 25 * 60 * 1000; // 25 minutes in ms

function timer(elapsed) {
  if (elapsed > duration) return;
  setTimeout(function() {
    percent = elapsed / duration * 100
    elapsedTimeElem.style.height = percent + '%'
    timer(elapsed + step)
  }, step);
}