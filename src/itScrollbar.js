'use strict';

/**
 * IT Scrollbar
 */
itModule.directive('itScrollbar', function ($window) {
    return {
        restrict : "EA",
        scope : true,
        require : ["itScrollbar", "^infiniTable"],
        replace : true,
        template :
            '<div class="it-scrollbar">' +
                '   <div class="it-sb-btn it-sb-btn-up">&#9650;</div>' +
                '   <div class="it-sb-track">' +
                '       <div class="it-sb-thumb"></div>' +
                '   </div>' +
                '   <div class="it-sb-btn it-sb-btn-down">&#9660;</div>' +
                '</div>',
        link : function($scope, $el, $attrs, controllers) {

            var ctrl = controllers[0];
            var tableCtrl = controllers[1];

            tableCtrl.$setScrollbarCtrl(ctrl);
            ctrl.$setTableCtrl(tableCtrl);
        },
        controller : function($scope, $element) {

            var ctrl = this,
                computed = false,
                context = null,
                isDragging = false,
                tableCtrl = null,
                $el = $element ;

            var btnUp   = $el.find(".it-sb-btn-up"),
                track   = $el.find(".it-sb-track"),
                thumb   = $el.find(".it-sb-thumb"),
                btnDown = $el.find(".it-sb-btn-down");

            ctrl.$setTableCtrl = function(_tableCtrl) {
                tableCtrl = _tableCtrl;
                context = tableCtrl.getContext();
            };

            ctrl.hide = function() {
                $el.hide();
            };

            ctrl.show = function() {
                $el.show();
            };

            var trackHeight = null,
                thumbHeight = null;

            var computeHeights = function() {

                var config = tableCtrl.getConfig();

                // track

                trackHeight = track.innerHeight();

                // thumb

                var ratio = context.pagination.count / context.pagination.total;
                thumbHeight = Math.floor(trackHeight * ratio);

                if(config.scrollbarThumbMinHeight && config.scrollbarThumbMinHeight > thumbHeight) {
                    thumbHeight = config.scrollbarThumbMinHeight;
                }
                if(config.scrollbarThumbMaxHeight && config.scrollbarThumbMaxHeight < thumbHeight) {
                    thumbHeight = config.scrollbarThumbMaxHeight;
                }

                thumb.height(thumbHeight);
                computed = true;
            };

            ctrl.refresh = function(recompute) {

                if(recompute || !computed) {
                    computeHeights();
                }

                var pagination = context.pagination;

                // thumb position
                if(!isDragging) {
                    var height = trackHeight - thumbHeight;
                    var percentage = pagination.first / (pagination.total - pagination.count);
                    var offset = height * percentage;
                    setThumbPosition(offset);
                }

                // thumb
                if(pagination.filled) {
                    thumb.show();
                } else {
                    thumb.hide();
                }

                // btn up
                if(pagination.first===0) {
                    btnUp.addClass("disabled");
                } else {
                    btnUp.removeClass("disabled");
                }

                // btn down
                if(pagination.last === (pagination.total-1)) {
                    btnDown.addClass("disabled");
                } else {
                    btnDown.removeClass("disabled");
                }
            };

            // thumb dragging

            var setThumbPosition = function(pos) {
                thumb.css({ top : pos });
            };

            thumb.draggable({
                containment: "parent",
                axis: "y",
                start: function(e, ui) {
                    isDragging = true;
                },
                drag: function(e, ui) {
                    var offset = ui.position.top;
                    var height = track.innerHeight() - thumb.height();
                    var percentage = offset * 100 / height;
                    $scope.$apply(function() {
                        tableCtrl.scroll.toPercent(percentage);
                    });
                },
                stop: function(e) {
                    isDragging = false;
                }
            });

            // track click

            track.mousedown(function(event) {
                if(thumb.is(event.target)) {
                    return;
                }

                var intervalId;
                var clickOffset = event.offsetY;
                var thumbPosition = thumb.position().top;

                var reverse = thumbPosition > clickOffset;

                var clearInterval = function() {
                    $window.clearInterval(intervalId);
                };

                var scrollPage = function() {
                    $scope.$apply(function() {
                        reverse ? tableCtrl.scroll.pageUp() : tableCtrl.scroll.pageDown();
                    });
                };

                var mouseUpHandler = function() {
                    clearInterval();
                    $($window).unbind("mouseup", mouseUpHandler);
                };

                scrollPage();
                intervalId = $window.setInterval(function() {
                    thumbPosition = thumb.position().top;
                    if(reverse ? thumbPosition < clickOffset : thumbPosition > clickOffset) {
                        mouseUpHandler();
                        return;
                    }
                    scrollPage();
                }, 100);
                $($window).mouseup(mouseUpHandler);
            });

            // btnUp / btnDown click

            var initIntervalScroll = function(reverse) {
                var intervalId;

                var clearInterval = function() {
                    $window.clearInterval(intervalId);
                };

                var scrollTick = function() {
                    $scope.$apply(function() {
                        tableCtrl.scroll.offset(reverse ? -1 : 1);
                    });
                };

                var startIntervalScroll = function() {
                    scrollTick();
                    intervalId = $window.setInterval(function() {
                        scrollTick();
                    }, 100);
                };

                var mouseUpHandler = function() {
                    clearInterval();
                    $($window).unbind("mouseup", mouseUpHandler);
                };

                return function() {
                    startIntervalScroll();
                    $($window).mouseup(mouseUpHandler);
                }
            };

            btnUp.mousedown(initIntervalScroll(true));
            btnDown.mousedown(initIntervalScroll(false));

        }
    }
});
