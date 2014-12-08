var app = {};
/**
 * initiator
 */
app.initiator = function (options) {
  options = options || {
    selector : '.floatalk-autocomplete textarea',
    sign: '#'
  }

  //defining variables
  var textbox = null, parentElem = null, shadowElem = null, shadowHTML = '',
      inputs = document.querySelectorAll(options.selector),
      keyCodes = {'enter': 13, 'upArrow': 38, 'downArrow': 40, 'leftArrow': 37, 'rightArrow': 39, 'end': 35, 'home': 36 },
      isNormalEvent = true,
      keySequence = false,
      menuFlag = false,
      isHighlighting = false,
      startPosition = -1,
      mentionCollection = [],

      rehash = new RegExp("\\s\\" + options.sign + "(\\S+)", "gim"),
      reSuggest = new RegExp( "\^" + options.sign + "[a-zA-Z0-9]+$"),

      hashTemplate = ' <a href="' + options.linkTo + '/$1" target="_blank" rel="nofollow">' + options.sign + '$1</a>';

  for (var i = 0; i < inputs.length; i++) {
    _addListener(inputs[i], 'keydown', _keyDownHandler);
    _addListener(inputs[i], 'keyup', _keyUpHandler);
    _addListener(inputs[i], 'mouseup', _shadowHandler);
    _addListener(inputs[i], 'focus', _targetIndicator);
  }

  //returning values
  this.getValue = function () {
    return {
      markup: app.markedupText,
      list: mentionCollection
    }
  }

  /**
   * cross browser event listener
   * @param {DOM object} element - the element to bind events on
   * @param {event} type - the type of event to be bound
   * @param {function} expression - the event listener
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
   * targetIndicator: sets parent and target element variables
   */
  function _targetIndicator (e) {
    //setting target
    textbox = e.target;
    parentElem = e.target.parentElement;
    shadowElem = parentElem.getElementsByClassName('floatalk-input-cloner');
    if(shadowElem.length == 0) {
      shadowElem = document.createElement('div');
      shadowElem.classList.add('floatalk-input-cloner');
      parentElem.appendChild(shadowElem);
    } else {
      shadowElem = shadowElem[0];
    }
  }

  /**
   * keyUpHandler: checks for 2 conditions of key input, mentioning and simply commenting
   * @param {event} event - keydown input event
   */
  function _keyUpHandler (e) {
    //if typing characters
    keySequence = false;
    if(!menuFlag) {
        _valueHandler(e);
    } else {
      e.preventDefault();
      menuHandler(e);
    }
  }

  /**
   * keyDownHandler: check if arrwkeys are pressed, then selecting starts
   *@param {event} event - keydown input event
   */
  function _keyDownHandler (e) {
    if (keySequence) {
      _valueHandler(e);
    } else {
      keySequence = true;
    }
    
  }

  /**
   * valueHandler: checks entire value for mentioning
   *@param {event} event - 
   */
  function _valueHandler (e) {
    var value = e.target.value;
    _shadowHandler(e);
    if (rehash.test(value)) {
      menuFlag = true;
    }
  }

  function menuHandler (e) {
    _shadowHandler(e);
    if (e.keyCode == keyCodes.downArrow) {
      move(1);
    } else if (e.keyCode == keyCodes.upArrow) {
      move(-1);
    } else {
      _suggest(e);
    }
    //this moves the .selected class over list items
    function move (direction) {
      var list = parentElem.getElementsByTagName('li');
      if (list.length != 0) {

        var selected = parentElem.getElementsByClassName('selected');
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
  }

  /**
   * suggest: open a list of suggested usernames
   *@param {event} event - keydown input event
   */
  function _suggest (e) {

    if (startPosition == -1) {
      // in keyup, the position of cursor is changed, so we need to aim to the prev char
      startPosition = _getCurrentPosition (e.target) - 1;
    }
    var value = e.target.value;
    value = value.substr(startPosition - 2, value.length - 1);
    // show suggestion menu if the current part of text
    // maches the username format
    if (e.keyCode == keyCodes.enter) {
      e.target.value = _setUser (e.target.value, value, app.list.getElementsByClassName('selected')[0].getAttribute('username'));
      _closeMenu();
    }
    if ( reSuggest.test(value) ) {
     _getUser(value, function (userList) {
       _createList(userList);
     });
    } else if (app.list) {
      _closeMenu();
    }
  }

  // reset every thing
  function _closeMenu () {
    app.list.style.display = 'none';
    menuFlag = false;
    startPosition = -1;
  }

  /*
   ** Returns the caret (cursor) position of the specified text field.
   ** Return value range is 0-oField.value.length.
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
   */
  function _getUser (username, callback) {
    var r = new XMLHttpRequest();
    r.open("GET", options.serviceUrl, true);
    r.onreadystatechange = function () {
      if (r.readyState != 4 || r.status != 200) return;
      callback ( JSON.parse(r.responseText) );
    };
    r.send("username=" + username);
  }

  /**
   * createList: append a list of users as a popup  in order to select from,
   *@param {array} users - list of objects with displayName/username keys
   */
  function _createList (users) {
    app.list = parentElem.getElementsByClassName('floatalk-suggested-user-List');

    if (app.list.length == 0) {
      app.list = document.createElement('ul');
      app.list.classList.add('floatalk-suggested-user-List');
      parentElem.appendChild(app.list);
    } else {
      app.list = app.list[0];
    }

    app.list.innerHTML = '';
    for (var i = 0; i < users.length; i++) {
      var item = document.createElement('li');
          item.innerHTML = users[i].username;
          item.setAttribute('username', users[i].username);
          item.setAttribute('displayname', users[i].displayName);
          _addListener(item, 'click', _setUser);
      if(i == 0) {
        item.className = 'selected';
      }

      app.list.appendChild(item);
    }
    app.list.style.display = "block";
  }

  /**
   *setUser : edits values in order  to set a mentioned user
   *@param {string} username
   */
  function _setUser (value, currentPart, username) {
    // devide from the starting point of current mentioning string
    var part = [];
    part[0] = value.substr(0, startPosition - 2);
    part[1] = value.substr(startPosition - 1, value.length - 1).replace(/^\s+|\s+$/g, '');

    //replacing the first mentioning format string with username
    part[1] = username + part[1].substr(currentPart.length - 1, part[1].length -1) + ' ';
    value = part.join(options.sign);

    var usernameTemplate = (' ' + options.sign + username + ' ').replace(rehash, hashTemplate);
    mentionCollection.push({'username': username, 'template': usernameTemplate});
    isHighlighting = true;

    return value;
  }

  // functions related to shadow
  function getSelectionText() {
      var text = "";
      if (window.getSelection) {
        text = window.getSelection().toString();
      } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
      }
      return text;
  }
  

  function _shadowHandler (e) {
    var temp = null;
    removeItem = -1;
    var value = event.target.value;
    var mentionItem = null;
    var markedupCollection = value.match(rehash) || [];
    app.markedupText = value.replace(rehash, hashTemplate);
    

  if(!isHighlighting) {
    for (var i = 0; i < mentionCollection.length; i++) {
      if (app.markedupText.indexOf(mentionCollection[i].template) == -1) {
        mentionCollection.splice(i, 1);
      }
    };
  }

  for (var i = 0; i < markedupCollection.length; i++) {
    removeItem = i;
    for (var j = 0; j < mentionCollection.length; j++) {
        if (mentionCollection[j].username == markedupCollection[i].split(options.sign)[1] ) {
        removeItem = -1;
        break;
      }
    };

    if (removeItem != -1) {
      
      temp = markedupCollection[removeItem].replace(rehash, hashTemplate);
      app.markedupText = app.markedupText.replace(temp, markedupCollection[removeItem]);
      removeItem = -1;
    }
  }
    
    shadowElem.innerHTML = app.markedupText;
    isHighlighting = false;
  }


}// end


