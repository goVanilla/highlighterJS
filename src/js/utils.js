
/**
 *
 * @name addClass
 *
 * @param el {object|string} - DOM object or CSS selector
 * @param name {string} - the string of class name(s) to be added
 *
 * @summary Checks if element doesn't have the class name, then adds it
 * @returns {object} element
 *
 **/
function _addClass (el, name) {
  if (el == undefined || el.className == undefined) return false;

  if (_hasClass (el, name)) {
    return el;
  }

  var classList = el.className;
  classList += ' ' + name;
  el.className = classList;

  return el;
}


/**
 *
 * @name removeClass
 *
 * @param el {object|string} - DOM object or CSS selector
 * @param name {string} - the string of class name(s) to be added
 *
 * @summary Checks if element does have the class name, then removes it
 * @returns {object} element
 *
 **/
function _removeClass (el, name) {
  if (el == undefined || el.className == undefined) return false;
  var classList = el.className;
  classList = classList.replace(name, '').replace(/\s+/g, " ").trim();
  el.className = classList;

  return el;
}

/**
 *
 * @name hasClass
 *
 * @param el {object|string} - DOM object or CSS selector
 * @param name {string} - the string of class name(s) to be added
 *
 * @summary Checks if element does have the class name
 * @returns {boolean}
 *
 **/
function _hasClass (el, name) {
  if (el == undefined) return false;
  return (el.className.indexOf(name.trim() + ' ') > -1 || el.className.indexOf(' ' + name.trim()) > -1);
}


/**
 *
 * @name toggleClass
 *
 * @param el {object|string} - DOM object or CSS selector
 * @param name {string} - the string of class name(s) to be added
 *
 * @summary checks if the element has the class name, then removes it and vise versa
 * @returns {object} element
 *
 **/
function _toggleClass (el, name) {
  if (_hasClass(el, name)) {
    _removeClass(el, name);
  } else {
    _addClass(el, name);
  }

  return el;
}


/**
 *
 * @name isObjectEmpty
 *
 * @param object {object|string} - The object to be checked to emptiness
 *
 * @summary checks if the object has any property other than properties of the constructor
 * @returns {boolean}
 *
 **/
function _isObjectEmpty (object) {
  var i = 0;
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      i++;
    }
  }
  return (i == 0);
}



/**
 *
 * @name merge
 *
 * @param obj1 {object} - The object which its properties in common with obj2 will overwritten by those of obj2
 *
 * @summary
 * @returns {object} - the result of merging two objects
 *
 **/
function _merge (obj1, obj2) {
  var obj = {};

  for (var x1 in obj1) {
    if (obj1.hasOwnProperty(x1)) {
      obj[x1] = obj1[x1];
    }
  }

  for (var x2 in obj2) {
    if (obj2.hasOwnProperty(x2) && x2 != '$attr' && x2 != '$$element') {
      obj[x2] = obj2[x2];
    }
  }
  return obj;
}

// moves the given class name from all siblings the target element to the target element
function _activateInSibligs (element, className) {
  if (typeof element == 'string') {
    element = document.querySelector(element);
  }
  var children = element.parentElement.children;

  for (var i = 0; i < children.length; i++) {
    _removeClass(children[i], className);
  }

  _addClass(element, className)
}
