// constants

const pointer_css_dictionary = {
  'position': 'absolute',
  'outline': 'solid 0px red',
  'background-color': 'transparent',
  'width': '10px',
  'height': '20px',
  'z-index': '10',
  'opacity': '100%',
  'mix-blend-mode': 'darken'
}

const toolbar_div_class_name = 'not_the_toolbar_you_deserve_but_the_toolbar_you_need'
const not_running_cursor_animation = 'all 100ms ease'

let initial_wpm = 250
let initial_wchunk = 3
let instance_ms = wpm2ms(initial_wpm)


// classes

class Toolbar {
  constructor(div, wpm_div) {
    this.dom = div
    this.wpm_div = wpm_div
    this.wpm_val = initial_wpm
    this.wpm = this.wpm_val
    this.wchunk = initial_wchunk
    this.color_index = 0
    this.auto = false
  }

  set wpm(n) {
    this.wpm_val = n
    $(this.wpm_div).text(this.wpm_val)
    instance_ms = wpm2ms(this.wpm)
  }

  get wpm() {
    return this.wpm_val
  }

}

class Marker {

  constructor(div) {
    this.dom = div
    this.color_code = 0
    this.color_hex = ''
    this.color = 0
    this.mode_code = 0
    this.mode = 0

    this.last_marked = null
  }

  build_mode(backColorHex, bordersBottomString='0px', bordersLeftString='0px', opacity='100%' ){
    return {
      'background-color': backColorHex,
      'border-bottom': bordersBottomString,
      'border-left': bordersLeftString,
      'opacity' : opacity
    }
  }

  get modes(){
    return ([
      this.build_mode(this.color_hex),
      this.build_mode('transparent', '2px solid' + this.color_hex),
      this.build_mode('transparent', '5px solid' + this.color_hex),
      this.build_mode('transparent', '0px solid', '5px solid'+this.color_hex),
      this.build_mode(this.color_hex, '0px', '0px', '20%')
    ])
  }

  get mode_css(){
    this.mode = this.mode_code
    return this.modes[this.mode_code]
  }

  get colors(){
    return ['#7FDBFF', '#01FF70', '#F012BE', '#DDDDDD', '#FF851B', '#FF4136', '#FFDC00']
  }

  set color(code) {
    this.color_code = code % this.colors.length
    this.color_hex = this.colors[this.color_code]
  }

  set mode(code){
    this.mode_code = code % this.modes.length
  }

  mark3(that, wchunk) {
    let t = 0
    let w = 0

    // w += el != null ? run ? that.parent.avg_word_length : el.width : 50
    w += 3*that.parent.avg_word_length
    t = that.next ? that.pre ? that.pre.time+1 : 5 : 1
    t *= instance_ms

    let left = that.pre ? that.pre.left-3 : that.left
    print(left)
    let calculated_words = [that]

    if (marker_force_resize || !arraysEqual(calculated_words, this.last_marked)){
      print(`marking ${that.dom.textContent} for ${t}`)
      $(this.dom).offset({
        'top': that.parent.top - that.parent.height / 4,
        'left': left
      });

      

      $(this.dom).css({
        'width': `${setCapped(w, 0, 30, 600)}px`,
        'width': `${w}px`,
        'height': that.parent.height*2
      });

      this.dom.style.transition = `all ${t}ms linear, width 100ms ease, height ${10}ms ease`
      marker_force_resize = false
      this.last_marked = calculated_words
    }
    
    $(this.dom).css(this.mode_css)
  }

  mark2(that, wchunk) {
    let calculated_words = []
    let t = 0
    let w = 0
    var i;
    for (i = 0; i < wchunk; i++) {
      let el = that.next_on_lsd(i)
      calculated_words.push(el)
      w += el!=null? run ? calculated_words[0].parent.avg_word_length : el.width : 50

      if (el != null) {
        if (el.next != null) {
          // word is not last in line
          // t += el.next.time
          w += 2
        } else {
          // t = 5
        }
      }
    }

    t = that.next ? that.pre ? that.pre.time+1 : 0 : 10
    t = that.next ? that.pre ? that.pre.time+1 : 5 : 1
    t *= instance_ms

    if (marker_force_resize || !arraysEqual(calculated_words, this.last_marked)){
      // print(`marking ${that.dom.textContent} for ${t}`)
      $(this.dom).offset({
        'top': that.parent.top - that.parent.height / 4,
        'left': that.left - 3
      });

      

      $(this.dom).css({
        'width': `${setCapped(w, 0, 30, 600)}px`,
        'width': `${w}px`,
        'height': that.parent.height*2
      });

      this.dom.style.transition = `all ${t}ms linear, width 100ms ease, height ${10}ms ease`
      marker_force_resize = false
      this.last_marked = calculated_words
    }
    
    $(this.dom).css(this.mode_css)
  }
}

class MapElement {
  constructor(el, p) {
    this.dom = el
    this.parent = p
  }
  get width(){
    return this.dom.getBoundingClientRect().width
  }
  get height() {
    return this.dom.getBoundingClientRect().height
  }
  get left() {
    return $(this.dom).offset().left
  }
  get top() {
    return $(this.dom).offset().top
  }
  get right() {
    return this.dom.getBoundingClientRect().right
  }
  get bottom() {
    return $(this.dom).offset().bottom
  }
}

class Line extends MapElement {
  constructor(lt, p, findex) {
    super(lt, p)
    this.words = []
    this.time = 0
    this.findex = findex
    this.avg_word_length = 0
    let word_divs = lt.getElementsByTagName('wt')
    for (var i = 0; i < word_divs.length; i++) {
      if (isWord(word_divs[i].textContent)){
        let w = new Word(word_divs[i], this, i)
        this.words.push(w)
        all_words.push(w)
        this.time += w.time
        this.avg_word_length += w.width + 2
      }
      
    }
    this.avg_word_length /= this.words.length
  }
}

class Word extends MapElement {
  constructor(wt, p, li, pi) {
    super(wt, p)
    this.content = wt.textContent
    this.time = parseInt(wt.getAttribute('l')) > 4 ? parseInt(wt.getAttribute('l')) : 4
    this.local_index = li

    //css
    $(this.dom).css({
      'cursor': 'pointer'
    });
    
    // listeners setup 
    this.dom.parent = this
    this.dom.addEventListener("click", word_click);
    this.dom.addEventListener("mouseover", word_over, false);
    this.dom.addEventListener("mouseout", word_out, false);

  }

  get public_index() {
    return this.parent.findex+this.local_index
  }

  get next() {
    if (this.local_index==this.parent.words.length-1) return null
    return this.parent.words[this.local_index+1]
  }
  get pre() {
    if (this.local_index == 0) return null
    return this.parent.words[this.local_index - 1]
  }

  next_on_lsd(i){
    if (i == 0) return this
    return this.next ? this.next.next_on_lsd(i-1) : null
  }

  pre_on_lsd(i){
    if (i == 0) return this
    return this.pre ? this.pre.pre_on_lsd(i-1) : null
  }
  
}

function word_click() {
  marker.dom.style.transition = not_running_cursor_animation
  marker_force_word_width = true
  moving = false
  toolbar.auto = false
  cursor = this.parent.public_index
}

function word_over() {
  this.style.backgroundColor = 'lightgray'
  this.style.padding = '10px'
}
function word_out(){
  this.style.backgroundColor = 'transparent'
  this.style.padding = '0px'
}


// set up

let lines = []
let all_words = []
let marker = null
let toolbar = null

function setUpDoc() {

  let line_divs = document.getElementsByTagName("line")
  setUpPointer()
  setUpToolbar()
  setUpLines(line_divs, lines)
}

function setUpPointer() {
  let pointer_div = document.createElement('div')
  $(pointer_div).css(pointer_css_dictionary);
  $('#reader').append(pointer_div)
  marker = new Marker(pointer_div)
}

function setUpToolbar() {

  let toolbar_div = document.getElementsByClassName(toolbar_div_class_name)
  let wpm_div = document.getElementById('wpm')
  let wpm_plus = document.getElementById('wpm_plus')
  let wpm_minus = document.getElementById('wpm_minus')

  toolbar = new Toolbar(toolbar_div, wpm_div)
}

function setUpLines(lines, lines_array) {

  findex = 0
  for (var i = 0; i < lines.length; i++) {
    let l = new Line(lines[i], document.body, findex)
    findex+=l.words.length
    lines_array.push(l)
  }
}

setUpDoc();

// key listeners
let keys = {};
let marker_force_resize = false
let marker_force_word_width = true
window.onkeyup = function (e) { keys[e.keyCode] = false; keyRelease(e.keyCode) }
window.onkeydown = function (e) { if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) e.preventDefault(); keys[e.keyCode] = true; keyPress(e.keyCode) }
window.onresize = function () { marker.dom.style.transition = not_running_cursor_animation;marker_force_resize=true };
// window.onscroll = function () { marker_force_resize = true };

// initialising the locked loop

let expected = Date.now() + instance_ms;
setTimeout(step, instance_ms);
function step() {
  let dt = Date.now() - expected; // the drift (positive for overshooting)
  if (dt > instance_ms) {
    expected = Date.now() + instance_ms;
    setTimeout(step, instance_ms);
  }
  tiktok();
  tiktokKeysHelper();
  expected += instance_ms;
  setTimeout(step, Math.max(0, instance_ms - dt)); // take into account drift
}


// LOCKED LOOP

let cursor = 0
let max_cursor = all_words.length-1
let instances = 0
let instance = 0
let wstep = 1
let dir = 1
let moving = false
let current_word = null
let current_line = null

let color_cursor = 0
let mode_cursor = 0

let last_of_the_line = false
let first_of_the_line = false

let run = false
//TODO make this a classs

function tiktok() {
  cappCursor()
  current_word = all_words[cursor]
  current_line = current_word.parent

  run = toolbar.auto || moving

  if (!run) {
    marker.dom.style.transition = not_running_cursor_animation
    instances = all_words[cursor].time
  }

  if (!last_of_the_line && current_word.next==null) {
    last_of_the_line= true
    // instances = 100000000000000
    // instances *= Math.floor(toolbar.wpm/100)*5
  }

  if (instance < instances) {
    marker.mark3(current_word, (toolbar.wchunk))
    instance += 1 * run
  }
  else {
    instance = 0
    cursor += wstep * dir
    cappCursor()
    // instances = all_words[cursor].time
    if (last_of_the_line) {
      last_of_the_line = false
      // instances *= Math.floor(toolbar.wpm / 100)
    }

  }

}


function tiktokKeysHelper() {
  right = keys[39]
  left = keys[37]

  if (right || left) {
    dir = 1
    if (left) dir = -1
    moving = true
  } else {
    moving = false
    dir = 1
  }
}

function keyPress(key) {

  switch (key) {
    case 37:
      //left

      if (!moving){
        marker.dom.style.transition = not_running_cursor_animation
        marker_force_word_width = true
        cursor-=1
      }

      break;
    case 39:
      //right

      if (!moving) {
        marker.dom.style.transition = not_running_cursor_animation
        marker_force_word_width = true
        cursor += 1
      }
      break;
    case 38:
      //up
      marker.dom.style.transition = not_running_cursor_animation
      marker_force_word_width = true

      lines2words(false)
      break;
    case 40:
      //down
      marker.dom.style.transition = not_running_cursor_animation
      marker_force_word_width = true
      lines2words(true)
      break;
    case 67:
      //c
      color_cursor += 1
      marker.color = color_cursor
      break;
    case 77:
      //m
      mode_cursor += 1
      marker.mode = mode_cursor
      break;
    case 187:
      //= (intepret it as +)
      toolbar.wpm = setCapped(toolbar.wpm, +10, 50, 990)
      break;
    case 189:
      //- 
      toolbar.wpm = setCapped(toolbar.wpm, -10, 50, 990)
      break;
    case 190:
      //> (intepret it as +)
      // marker_force_resize = true
      toolbar.wchunk = setCapped(toolbar.wchunk, +1, 1, 5)
      break;
    case 188:
      //<
      // marker_force_resize = true
      toolbar.wchunk = setCapped(toolbar.wchunk, -1, 1, 5)
      break;
    default:
    // code block
  }
}


function keyRelease(key) {

  switch (key) {
    case 37:
      //left
      moving = false
      break;
    case 39:
      //right
      moving = false
      break;
    case 65:
      //a
      toolbar.auto = !toolbar.auto
      break;
    default:
    // code block
  }
}

// utility functions

function print(val) {
  // TODO deprecate this
  console.log(val)
}

jQuery.expr[':'].space = function (elem) {
  let $elem = jQuery(elem);
  return !$elem.children().length && !$elem.text().match(/\S/);
}

function wpm2ms(wpm) {
  const average_letters_in_word = 4.79 // actually 4.79
  return 1000 / ((wpm / 60) * average_letters_in_word) // big brain meth
}

function length2ms(length) {

}

function slice_around(ary, i, l) {
  let start = i - Math.round((l - 1) / 2)
  let end = i + Math.round((l - 1) / 2)
  return ary.slice(cap(start, 0, ary.length - 1), cap(end, 0, ary.length - 1) + 1)
}

function isEven(n) {
  return n % 2 == 0;
}

function cap(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

function lines2words(down = true) {
  cursor = setCapped(cursor, down ? (current_line.words.length - current_word.local_index) : -current_word.local_index - 1, 0, Infinity)
  if (!down) cursor = setCapped(cursor, -all_words[cursor].parent.words.length + 1, 0, Infinity)
}

function setCapped(vari, val, final_min, final_max) {
  target_val = vari + val
  return cap(target_val, final_min, final_max)
}

function cappCursor(){
  cursor = cursor > 0 ? cursor < max_cursor ? cursor : max_cursor : 0
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
function isNumber(string){
  return (+string === +string)
}

function isWord(string){
  if (string.length>2) return true
  if (!isNumber(string)) return true
  return false
}
