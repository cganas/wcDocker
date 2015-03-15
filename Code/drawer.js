/*
  A docker container for carrying its own arrangement of docked panels as a slide out drawer.
*/
function wcDrawer(container, parent, position) {
  this.$container = $(container);
  this.$drawer    = null;
  this._position  = position;
  this._parent    = parent;
  this._root      = null;
  this._size      = 0.5;
  this._expanded  = true;
  this._sliding   = false;
  this._horizontal= this._position === wcDocker.DOCK_LEFT || this._position === wcDocker.DOCK_RIGHT;

  this.__init();
}

wcDrawer.prototype = {
///////////////////////////////////////////////////////////////////////////////////////////////////////
// Public Functions
///////////////////////////////////////////////////////////////////////////////////////////////////////
  // Collapses the drawer to its respective side wall.
  collapse: function() {
    if (this._expanded) {
      this._size = this._parent.pos();
      this._expanded = false;
      this._sliding = true;

      var self = this;
      var fin = function() {
        self._sliding = false;
      }

      switch (this._position) {
        case wcDocker.DOCK_TOP:
        case wcDocker.DOCK_LEFT:
          this._parent.animPos(0, fin);
          break;
        case wcDocker.DOCK_RIGHT:
        case wcDocker.DOCK_BOTTOM:
          this._parent.animPos(1, fin);
          break;
      }
    }
  },

  // Expands the drawer.
  expand: function() {
    if (!this._expanded) {
      this._expanded = true;
      this._sliding = true;
      var self = this;
      this._parent.animPos(this._size, function() {
        self._sliding = false;
      });
    }
  },

  // Toggles whether the drawer is collapsed or expanded.
  // Params:
  //    expanded    Optional set the current state expanded (true) or collapsed (false)
  //                if omitted, will toggle the current state.
  toggle: function(expanded) {
    if (expanded === undefined) {
      expanded = !this._expanded;
    }

    expanded? this.expand(): this.collapse();
  },

  minSize: function() {
    if (this._expanded) {
      if (this._root && typeof this._root.minSize === 'function') {
        return this._root.minSize();
      } else {
        return {x: 100, y: 100};
      }
    }
    return {x: 0, y: 0};
  },

  maxSize: function() {
    if (this._expanded || this._sliding) {
      if (this._root && typeof this._root.maxSize === 'function') {
        return {
          x: (this._horizontal?  this._root.maxSize().x: Infinity),
          y: (!this._horizontal? this._root.maxSize().y: Infinity)
        };
      } else {
        return {x: Infinity, y: Infinity};
      }
    }
    return {
      x: (this._horizontal?  0: Infinity),
      y: (!this._horizontal? 0: Infinity)
    };
  },

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Private Functions
///////////////////////////////////////////////////////////////////////////////////////////////////////
  __init: function() {
    this.$drawer = $('<div class="wcDrawer"></div>');

    switch (this._position) {
      case wcDocker.DOCK_LEFT:
        this.$drawer.addClass('wcDrawerLeft');
        break;
      case wcDocker.DOCK_RIGHT:
        this.$drawer.addClass('wcDrawerRight');
        break;
      case wcDocker.DOCK_TOP:
        this.$drawer.addClass('wcDrawerTop');
        break;
      case wcDocker.DOCK_BOTTOM:
        this.$drawer.addClass('wcDrawerBottom');
        break;
    }

    this.__container(this.$container);
  },

  // Updates the size of the drawer.
  __update: function(opt_dontMove) {
    if (this._root) {
      this._root.__update(opt_dontMove);
    }
  },

  // Checks if the mouse is in a valid anchor position for docking a panel.
  // Params:
  //    mouse     The current mouse position.
  //    ghost     The ghost object.
  __checkAnchorDrop: function(mouse, same, ghost, canSplit) {
    var width = this.$drawer.width();
    var height = this.$drawer.height();
    var offset = this.$drawer.offset();

    if (!this._root && mouse.y >= offset.top && mouse.y <= offset.top + height &&
        mouse.x >= offset.left && mouse.x <= offset.left + width) {
      ghost.anchor(mouse, {
        x: offset.left-2,
        y: offset.top-2,
        w: width,
        h: height,
        loc: wcDocker.DOCK_STACKED,
        item: this,
        self: false,
      });
      return true;
    }
    return false;
  },

  // Retrieves the bounding rect for this drawer.
  __rect: function() {
    var offset = this.$drawer.offset();
    var width = this.$drawer.width();
    var height = this.$drawer.height();

    return {
      x: offset.left,
      y: offset.top,
      w: width,
      h: height,
    };
  },

  // Triggers an event exclusively on the docker and none of its panels.
  // Params:
  //    eventName   The name of the event.
  //    data        A custom data parameter to pass to all handlers.
  __trigger: function(eventName, data) {
    if (this._root) {
      this._root.__trigger(eventName, data);
    }
  },

  // Saves the current panel configuration into a meta
  // object that can be used later to restore it.
  __save: function() {
    var data = {};
    data.type     = 'wcDrawer';
    data.position = this._position;
    data.size     = this._size;
    data.expanded = this._expanded;
    if (this._root) {
      data.root = this._root.__save();
    }
    return data;
  },

  // Restores a previously saved configuration.
  __restore: function(data, docker) {
    this._size     = data.size;
    this._expanded = data.expanded;
    if (data.root) {
      this._root = docker.__create(data.root, this, this.$drawer);
      this._root.__restore(data.root, docker);
    }
  },

  // Gets, or Sets a new container for this layout.
  // Params:
  //    $container          If supplied, sets a new container for this layout.
  //    parent              If supplied, sets a new parent for this layout.
  // Returns:
  //    JQuery collection   The current container.
  __container: function($container) {
    if (typeof $container === 'undefined') {
      return this.$container;
    }

    this.$container = $container;
    if (this.$container) {
      this.$container.append(this.$drawer);
    } else {
      this.$drawer.remove();
    }
    return this.$container;
  },

  // Disconnects and prepares this widget for destruction.
  __destroy: function() {
    if (this._root) {
      this._root.__destroy();
      this._root = null;
    }
    this.__container(null);
    this._parent = null;
  },
}