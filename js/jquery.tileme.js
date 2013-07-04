﻿/*!
 * jQuery tileMe Plugin
 * Original author: @linh4nq
 * Licensed under the MIT license
 */

(function ($) {
  var tileMe = function (container, childSelector, options) {
    var self = $(container);
    var obj = this;
    var defaults = {
      baseWidth: 200,
      baseHeight: 200,
      spacing: 2,
      dataCols: 'data-cols',
      dataRows: 'data-rows',
      tiledClass: 'tiled',
      failedClass: 'failed',
      retileOnReisze: false,
      // callbacks
      onElementTiled: function (e) { },
      onTileComplete: function (e) { },
    };
    var settings = $.extend({}, defaults, options);

    var elements;
    var containerWidth;
    var baseWidth, baseHeight, baseLeft = 0;

    var positions = new Array();
    var totalCols;

    var MAX_FAILED_TIMES = 2;


    // events
    var t;
    if (settings.retileOnReisze) {
      $(window).resize(function () {
        clearTimeout(t);
        t = setTimeout(function () { init(); }, 1000);
      });
    }

    // public
    this.add = function () {
      doTile();
    };

    // private
    var init = function () {
      self.css({ 'position' : 'relative' });
      containerWidth = self.width();
      totalCols = Math.ceil(containerWidth / settings.baseWidth);

      baseWidth = containerWidth / totalCols;
      baseHeight = (settings.baseHeight / settings.baseWidth) * baseWidth;
      reset();
      doTile();
    };

    var reset = function () {
      elements = self.find(childSelector);
      elements.removeClass(settings.tiledClass).removeClass(settings.failedClass);
      for (i = 0; i < totalCols; i++) {
        positions[i] = 0;
      }
    }

    var doTile = function () {
      elements = self.find(childSelector);
      while (elements.not('.' + settings.tiledClass).length > 0) {
        var element = elements.not('.' + settings.tiledClass).first();
        tileElement(element);
        elements = self.find(childSelector);
      }
      resizeContainer();
      settings.onTileComplete(self);
    };

    var resizeContainer = function () {
      var maxLevel = 0;
      for (i = 0; i < totalCols; i++) {
        if (maxLevel < positions[i])
          maxLevel = positions[i];
      }
      var height = maxLevel * baseHeight;
      self.height(height);
    };

    var tileElement = function (element) {
      var lowestLevel = Infinity,  // should be lowest number available
          bestcol = 0,  // col to insert
          posWidth = 0, // number of cols available from that position
          maxPostWidth = 0,
          mostSuitCol = 0,
          found = false, // is found a good position to insert?
          differentLevel = true;

      var failedTimes = parseInt(element.attr('data-failed') !== undefined ? element.attr('data-failed') : 0);

      var cols = parseInt(element.attr(settings.dataCols) !== undefined ? element.attr(settings.dataCols) : 1);
      var rows = parseInt(element.attr(settings.dataRows) !== undefined ? element.attr(settings.dataRows) : 1);

      cols = Math.min(cols, totalCols); // an element cannot larger than the container
      rows = Math.min(rows, totalCols);

      // find lowest level to insert
      for (i = 0; i < totalCols; i++) {
        if (positions[i] < lowestLevel) {
          lowestLevel = positions[i];
        }
      }
      // find if we have enough space to insert
      for (i = 0; i < totalCols; i++) {
        if (positions[i] == lowestLevel) {
          posWidth++;
          if (differentLevel === true) {
            bestcol = i;
            differentLevel = false;
          }
          if (posWidth > maxPostWidth) {
            maxPostWidth = posWidth;
            mostSuitCol = bestcol;
          }
        }
        else {
          posWidth = 0;
          differentLevel = true;
        }
        if (posWidth == cols) { // found best pos!
          found = true;
          break;
        }
      }

      if (found) {
        positionElement(element, cols, rows, bestcol);
      }
      else {
        failedTimes++;
        if (failedTimes == MAX_FAILED_TIMES) {
          // we have to resize to fit
          if (cols / rows == maxPostWidth) {
            var ratio = rows / cols;
            cols = maxPostWidth;
            rows = ratio * cols;
          }
          else {
            cols = maxPostWidth;
          }
          element.addClass(settings.failedClass);
          positionElement(element, cols, rows, mostSuitCol);
        }
        element.attr('data-failed', failedTimes).remove().appendTo(self);
      }
      return found;
    };

    var positionElement = function (element, cols, rows, columnToInsert) {
      var elementWidth = baseWidth * cols - settings.spacing;
      var elementHeight = baseHeight * rows - settings.spacing;

      //if (cols + columnToInsert == totalCols && elementWidth < settings.baseWidth - settings.spacing)
      //{
      //  elementWidth += settings.spacing / 2;
      //}

      // positioning element
      element.width(elementWidth);
      element.height(elementHeight);
      element.css({ position: 'absolute', top: (positions[columnToInsert] * baseHeight) + 'px', left: (baseLeft + columnToInsert * baseWidth) + 'px' });

      // update positions
      for (i = columnToInsert; i < columnToInsert + cols; i++) {
        positions[i] = positions[i] + rows;
      }
      element.addClass(settings.tiledClass);
      settings.onElementTiled(element);
    }

    /////////////////////////////////
    init();
  };

  $.fn.tileMe = function (childSelector, options) {
    return this.each(function () {
      var container = $(this);
      // Return early if this element already has a plugin instance
      if (container.data('tileMe')) return;
      // pass options to plugin constructor
      var me = new tileMe(this, childSelector, options);
      // Store plugin object in this element's data
      container.data('tileMe', me);
    });
  };
})(jQuery);
