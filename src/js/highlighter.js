
(function (root, factory) {
  if (typeof exports === 'object') {
    // CommonJS
    factory(exports);
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['exports'], factory);
  } else {
    // Browser globals
    factory(root);
  }
} (this, function (exports) {
  //Default config/variables
  var VERSION = '0.1.0';




  function HighlighterJs () {


    /**
     *
     * @type {{}}
     * @private
     *
     */

    this._options = {
      'selector' : '.highlighter-target',
      'serviceUrl': '/api/users.json',
      'sign': '@',
      'linkTo' : 'http://facebook.com'
    };

  }


  function _start () {

    var that = this;

    this._elements = {
      textBox: null,
      parentElement: null,
      shadowElement: null,
      shadowHTML: ''
    };

    this._inputs = document.querySelectorAll(this._options.selector);

    this._flags = {
      keyCodes : {'enter': 13, 'upArrow': 38, 'downArrow': 40, 'leftArrow': 37, 'rightArrow': 39, 'end': 35, 'home': 36 },

      isNormalEvent: true,
      keySequence: false,
      menuFlag: false,
      isHighlighting: false,
      startPosition: -1,
      mentionCollection: [],

      rehash: new RegExp("\\s\\" + this._options.sign + "(\\S+)", "gim"),
      reSuggest: new RegExp( "\^" + this._options.sign + "[a-zA-Z0-9]+$"),
      hashTemplate: ' <a href="' + this._options.linkTo + '/$1" target="_blank" rel="nofollow">' + this._options.sign + '$1</a>'
    };


    for (var i = 0; i < this._inputs.length; i++) {
      _addListener(this._inputs[i], 'keydown', function (e) {
        _keyDownHandler.apply(this, [e, that]);
      });
      _addListener(this._inputs[i], 'keyup', function (e) {
        _keyUpHandler.apply(this, [e, that]);
      });
      _addListener(this._inputs[i], 'mouseup', function (e) {
        _shadowHandler.apply(this, [e, that]);
      });
      _addListener(this._inputs[i], 'focus', function (e) {
        _targetIndicator.apply(this, [e, that]);
      });
    }
  }



  /**
   *
   * @name _addListener
   * @private
   *
   * @summery cross browser event listener
   * @param {node} element - the element to bind events on
   * @param {string} type - the type of event to be bound to
   * @param {function} expression - the event listener
   *
   */
  function _addListener (element, type, expression) {
    var bubbling = false;
    if(window.addEventListener) { // Standard
      element.addEventListener(type, expression, bubbling);
    } else if (window.attachEvent) { // IE
      element.attachEvent('on' + type, expression);
    } else return false;
  }



  /**
   *
   * @name _keyUpHandler
   * @private
   *
   * @summery checks for 2 conditions of key input, mentioning and simply commenting
   * @param {event} e - keyup input event object
   * @param {function} highlighter - the instance of highlighterJs
   *
   */
  function _keyUpHandler (e, highlighter) {
    //if typing characters
    highlighter._flags.keySequence = false;
    if(!highlighter._flags.menuFlag) {
      _valueHandler.call(highlighter, e);
    } else {
      e.preventDefault();
      _menuHandler.call(highlighter, e);
    }
  }

  /**
   *
   * @name _keyDownHandler
   * @private
   *
   * @summery check if arrow keys are pressed, then selecting starts
   * @param {event} e - keydown input event object
   * @param {function} highlighter - the instance of highlighterJs
   *
   */
  function _keyDownHandler (e, highlighter) {
    if (highlighter._flags.keySequence) {
      _valueHandler.call(highlighter, e);
    } else {
      highlighter._flags.keySequence = true;
    }
  }


  /**
   * @name _valueHandler
   * @private
   *
   * @summery checks entire value for mentioning. decides to show or hide menu. This will be called on highlighter instance namespace
   * @param {event} e - the original event object
   *
   */
  function _valueHandler (e) {
    var value = e.target.value;
    //console.log(value);
    _shadowHandler(e, this);
    if (this._flags.rehash.test(value)) {
      this._flags.menuFlag = true;
    }
  }


  /**
   * @name _menuHandler
   * @private
   *
   * @summery
   * @param {event} e - the original event object
   *
   */
  function _menuHandler (e) {
    _shadowHandler(e, this);
    if (e.keyCode == this._flags.keyCodes.downArrow) {
      _move.call(this, 1);
    } else if (e.keyCode == this._flags.keyCodes.upArrow) {
      _move.call(this, -1);
    } else {
      _suggest.call(this, e);
    }
  }


  /**
   *
   * @name _move
   * @param direction
   * @private
   *
   * @summery this moves the .selected class over list items
   *
   */
  function _move (direction) {
    var list = this._elements.parentElement.getElementsByTagName('li');
    if (list.length != 0) {

      var selected = this._elements.parentElement.getElementsByClassName('selected');
      var index = Array.prototype.indexOf.call(list, selected[0]);
      list[index].classList.remove('selected');

      if (index == list.length - 1 && direction == 1) {
        index =- direction;
      } else if (index == 0 && direction == -1) {
        index = list.length;
      }

      list[index + direction].classList.add('selected');
    }
  }

  /**
   * @name _targetIndicator
   * @private
   *
   * @summery sets parent and target element variables
   * @param {event} e -
   * @param {function} - highlighter
   *
   */
  function _targetIndicator (e, highlighter) {
    console.log(this);
    //setting target
    highlighter._elements.textBox = e.target;
    highlighter._elements.parentElement = e.target.parentElement;
    highlighter._elements.shadowElement = highlighter._elements.parentElement.getElementsByClassName('highlighter-clone');
    if(highlighter._elements.shadowElement.length == 0) {
      highlighter._elements.shadowElement = document.createElement('div');
      highlighter._elements.shadowElement.classList.add('highlighter-clone');
      highlighter._elements.parentElement.appendChild(highlighter._elements.shadowElement);
    } else {
      highlighter._elements.shadowElement = highlighter._elements.shadowElement[0];
    }
  }


  /**
   * @name _shadowHandler
   * @summery
   *
   * @private
   * @param {event} e
   * @param {function} highlighter
   *
   */
  function _shadowHandler (e, highlighter) {
    var temp = null;
    var removeItem = -1;
    var value = event.target.value;
    var mentionItem = null;
    var markedupCollection = value.match(highlighter._flags.rehash) || [];
    highlighter._flags.markedupText = value.replace(highlighter._flags.rehash, highlighter._flags.hashTemplate);


    if(!highlighter._flags.isHighlighting) {
      for (var i = 0; i < highlighter._flags.mentionCollection.length; i++) {
        if (highlighter._flags.markedupText.indexOf(highlighter._flags.mentionCollection[i].template) == -1) {
          highlighter._flags.mentionCollection.splice(i, 1);
        }
      }
    }

    for (i = 0; i < markedupCollection.length; i++) {
      removeItem = i;
      for (var j = 0; j < highlighter._flags.mentionCollection.length; j++) {
        if (highlighter._flags.mentionCollection[j].username == markedupCollection[i].split(highlighter._flags.options.sign)[1] ) {
          removeItem = -1;
          break;
        }
      }

      if (removeItem != -1) {

        temp = markedupCollection[removeItem].replace(highlighter._flags.rehash, highlighter._flags.hashTemplate);
        highlighter._flags.markedupText = highlighter._flags.markedupText.replace(temp, markedupCollection[removeItem]);
        removeItem = -1;
      }
    }

    console.log(highlighter._flags.markedupText);
    highlighter._elements.textBox = '';
    highlighter._elements.shadowElement.innerHTML = highlighter._flags.markedupText;
    highlighter._flags.isHighlighting = false;
  }


  /**
   *
   * @name _suggest
   * @summery open a list of suggested usernames
   *
   * @private
   * @param {event} e - keydown input event
   *
   */
  function _suggest (e) {
    console.log('suggest');
    var that = this;

    if (this._flags.startPosition == -1) {
      // in keyup, the position of cursor is changed, so we need to aim to the prev char
      this._flags.startPosition = _getCurrentPosition(e.target) - 1;
    }
    var value = e.target.value;
    value = value.substr(this._flags.startPosition - 3, value.length - 1);
    console.log(value);
    // show suggestion menu if the current part of text
    // maches the username format
    if (e.keyCode == this._flags.keyCodes.enter) {
      e.target.value = _setUser.call(this, e.target.value, value, this._elements.list.getElementsByClassName('selected')[0].getAttribute('username'));
      _closeMenu.call(this);
    }

    console.log();
    if ( this._flags.reSuggest.test(value) ) {

      _getUser.call(this, value, function (userList) {
        _createList.call(that, userList, e.target.value, value);
      });
    } else if (this._elements.list) {
      _closeMenu.call(this);
    }
  }


  /**
   *
   * @name _closeMenu
   * @private
   *
   * @summery resets every thing
   *
   */
  function _closeMenu () {
    this._elements.list.style.display = 'none';
    this._flags.menuFlag = false;
    this._flags.startPosition = -1;
  }


  /**
   * Returns the caret (cursor) position of the specified text field.
   * Return value range is 0-oField.value.length.
   */
  function _getCurrentPosition (oField) {
    // Initialize
    var iCurrentPosition = 0;
    // IE Support
    if (document.selection) {
      // To get cursor position, get empty selection range
      var oSel = document.selection.createRange();
      // Move selection start to 0 position
      oSel.moveStart('character', - oField.value.length);
      // The caret position is selection length
      iCurrentPosition = oSel.text.length;
    }
    // Firefox support
    else if (oField.selectionStart || oField.selectionStart == '0') {
      iCurrentPosition = oField.selectionStart;
    }
    // Return results
    return iCurrentPosition;
  }

  /**
   * getUser: requests for user list,
   * @param {string} username - the username after @ sign
   * @param {function} callback -
   *
   */
  function _getUser (username, callback) {
    var r = new XMLHttpRequest();
    r.open("GET", this._options.serviceUrl, true);
    r.onreadystatechange = function () {
      if (r.readyState != 4 || r.status != 200) return;
      callback( JSON.parse(r.responseText) );
    };
    r.send("username=" + username);
  }

  /**
   * createList: append a list of users as a popup  in order to select from,
   * @param {array} users - list of objects with displayName/username keys
   * @param {string} value
   * @param {string} currentPart
   */
  function _createList (users, value, currentPart) {
    console.log('create list');
    var that = this;
    this._elements.list = this._elements.parentElement.getElementsByClassName('highlighter-List');

    if (this._elements.list.length == 0) {
      this._elements.list = document.createElement('ul');
      this._elements.list.classList.add('highlighter-List');
      this._elements.parentElement.appendChild(this._elements.list);
    } else {
      this._elements.list = this._elements.list[0];
    }

    this._elements.list.innerHTML = '';
    for (var i = 0; i < users.length; i++) {
      var item = document.createElement('li');
      item.innerHTML = users[i].username;
      item.setAttribute('username', users[i].username);
      item.setAttribute('displayname', users[i].displayName);
      _addListener(item, 'click', function (e) {
        _setUser.apply(that, [value, currentPart, e.target.attributes.username.value]);
      });
      if(i == 0) {
        item.className = 'selected';
      }

      this._elements.list.appendChild(item);
    }
    this._elements.list.style.display = "block";
  }

  /**
   *
   * @name _setUser
   * @private
   *
   * @summery edits values in order  to set a mentioned user
   * @param {string} value
   * @param {string} currentPart
   * @param {string} username
   *
   */
  function _setUser (value, currentPart, username) {
    // divide from the starting point of current mentioning string
    var part = [];
    part[0] = value.substr(0, this._flags.startPosition - 3);
    part[1] = value.substr(this._flags.startPosition - 2, value.length - 1).replace(/^\s+|\s+$/g, '');
    console.log(part);

    //replacing the first mentioning format string with username
    part[1] = username + part[1].substr(currentPart.length - 1, part[1].length -1) + ' ';
    console.log(part[1]);
    value = part.join(this._options.sign);
    console.log(value);

    var usernameTemplate = (' ' + this._options.sign + username + ' ').replace(this._flags.rehash, this._flags.hashTemplate);
    console.log(usernameTemplate);
    this._flags.mentionCollection.push({'username': username, 'template': usernameTemplate});

    this._flags.markedupText = value;
    this._flags.isHighlighting = true;
    console.log(this._flags.markedupText, part);

    return value;
  }





















  HighlighterJs.version = VERSION;

  //Prototype
  HighlighterJs.fn = HighlighterJs.prototype = {

    setOption: function(option, value) {
      this._options[option] = value;
      return this;
    },
    setOptions: function(options) {
      this._options = _merge(this._options, options);
      return this;
    },
    start: function () {
      _start.call(this);
      return this;
    },

    onbeforechange: function(providedCallback) {
      //if (typeof (providedCallback) === 'function') {
      //  this._introBeforeChangeCallback = providedCallback;
      //} else {
      //  throw new Error('Provided callback for onbeforechange was not a function');
      //}
      //return this;
    }

  };

  exports.HighlighterJs = HighlighterJs;
  return HighlighterJs;
}));



