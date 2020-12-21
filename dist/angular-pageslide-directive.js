
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['angular'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('angular'));
    } else {
        factory(root.angular);
    }
}(this, function (angular) {

    angular
        .module('pageslide-directive', [])
        .directive('pageslide', ['$document', '$timeout', '$window', '$parse', function ($document, $timeout, $window, $parse) {
            var defaults = {};


            return {
                restrict: 'EA',
                transclude: false,
                scope: {
                    psOpen: '=?',
                    psAutoClose: '@',
                    psSide: '@',
                    psSpeed: '@',
                    psClass: '@',
                    psSize: '@',
                    psZindex: '@',
                    psPush: '@',
                    psContainer: '@',
                    psKeyListener: '@',
                    psBodyClass: '@',
                    psClickOutside: '@',
                    psRemoveHeight: '@',
                    onopen: '&?',
                    onclose: '&?'
                },
                link: function (scope, el, attrs) {

                    var param = {};

                    param.side = scope.psSide || 'right';
                    param.speed = scope.psSpeed || '0.5';
                    param.size = scope.psSize || '300px';
                    param.zindex = scope.psZindex || 1000;
                    param.className = scope.psClass || 'ng-pageslide';
                    param.push = scope.psPush === 'true';
                    param.container = scope.psContainer || false;
                    param.keyListener = scope.psKeyListener === 'true';
                    param.bodyClass = scope.psBodyClass || false;
                    param.clickOutside = scope.psClickOutside !== 'false';
                    param.autoClose = scope.psAutoClose === 'true';
                    param.removeHeight = scope.psRemoveHeight || false;
                    param.height = 0;
                    param.defaultSize = param.size;

                    param.push = param.push && !param.container;

                    el.addClass(param.className);

                    /* DOM manipulation */

                    var content, slider, body, isOpen = false;

                    if (param.container) {
                        body = document.getElementById(param.container);
                    } else {
                        body = document.body;
                    }

                    if ( param.removeHeight ) {
                        param.removeHeight = angular.element(param.removeHeight);

                        if (!param.removeHeight.length) {
                            param.removeHeight = null;
                        }
                    }

                    function get_negative_size(size) {

                        if (size.indexOf('calc(') === 0) {

                            return size.replace('calc(', 'calc(-').replace(' - ', ' + ');
                        }

                        return '-' + param.size;
                    }

                    function calc_height(size) {

                        param.height = parseInt(size, 10);
                        var new_height;

                        switch (param.side) {
                            case 'top':
                                new_height = (!param.height ? param.size : 'calc(' + param.defaultSize + ' - ' + param.height + 'px)');
                                param.size = new_height;
                                slider.style.height = param.size;
                                slider.style.top = !scope.psOpen ? "0px" : get_negative_size(new_height);

                                if (param.push) {
                                    slider.style.top = '0px';
                                }
                                else {
                                    slider.style.top = scope.psOpen ? param.height + 'px' : get_negative_size(new_height);
                                }
                                break;
                            case 'bottom':
                                new_height = (!param.height ? param.size : 'calc(' + param.defaultSize + ' - ' + param.height + 'px)');
                                param.size = new_height;
                                slider.style.height = param.size;
                                slider.style.top = '';
                                slider.style.bottom = scope.psOpen ? "0px" : get_negative_size(new_height);
                                break;
                            default:
                                new_height = !param.height ? '100%' : ('calc(100% - ' + param.height + 'px)');
                                slider.style.height = new_height;
                                slider.style.top = (!param.height) ? '0px' : '';
                        }
                    }

                    function onBodyClick(e) {
                        var target = e.touches && e.touches[0] || e.target;
                        if(
                            isOpen &&
                            body.contains(target) &&
                            !slider.contains(target)
                        ) {
                            isOpen = false;
                            scope.psOpen = false;
                            scope.$apply();
                        }

                        if(scope.psOpen) {
                            isOpen = true;
                        }
                    }

                    function setBodyClass(value){
                        if (param.bodyClass) {
                            var bodyClass = param.className + '-body';
                            var bodyClassRe = new RegExp(bodyClass + '-closed|' + bodyClass + '-open');
                            body.className = body.className.replace(bodyClassRe, '');
                            var newBodyClassName = bodyClass + '-' + value;
                            if (body.className[body.className.length -1] !== ' ') {
                                body.className += ' ' + newBodyClassName;
                            } else {
                                body.className += newBodyClassName;
                            }
                        }
                    }

                    slider = el[0];

                    if (slider.tagName.toLowerCase() !== 'div' &&
                        slider.tagName.toLowerCase() !== 'pageslide') {
                        throw new Error('Pageslide can only be applied to <div> or <pageslide> elements');
                    }

                    if (slider.children.length === 0) {
                        throw new Error('You need to have content inside the <pageslide>');
                    }

                    content = angular.element(slider.children);

                    body.appendChild(slider);

                    slider.style.zIndex = param.zindex;
                    slider.style.position = 'fixed';
                    slider.style.transitionDuration = param.speed + 's';
                    slider.style.webkitTransitionDuration = param.speed + 's';
                    slider.style.height = param.size;
                    slider.style.transitionProperty = 'top, bottom, left, right';

                    if (param.push) {
                        body.style.position = 'absolute';
                        body.style.transitionDuration = param.speed + 's';
                        body.style.webkitTransitionDuration = param.speed + 's';
                        body.style.transitionProperty = 'top, bottom, left, right';
                    }

                    if (param.container) {
                        slider.style.position = 'absolute';
                        body.style.position = 'relative';
                        body.style.overflow = 'hidden';
                    }

                    function onTransitionEnd() {

                        if (!scope.psOpen) {
                            $parse(scope.onclose)();
                            $timeout(function () {
                                scope.$apply();
                            });
                        }
                    }

                    slider.addEventListener('transitionend', onTransitionEnd);

                    function initSlider(slider, param) {
                        switch (param.side) {
                            case 'right':
                                slider.style.width = param.size;
                                slider.style.height = (!param.height ? '100%' : 'calc(100% - ' + param.height + 'px)');
                                slider.style.top = (!param.height) ? '0px' : '';
                                slider.style.bottom = '0px';
                                break;
                            case 'left':
                                slider.style.width = param.size;
                                slider.style.height = (!param.height ? '100%' : 'calc(100% - ' + param.height + 'px)');
                                slider.style.top = (!param.height) ? '0px' : '';
                                slider.style.bottom = '0px';
                                break;
                            case 'top':
                                slider.style.height = (!param.height ? param.size : 'calc(' + param.defaultSize + ' - ' + param.height + 'px)');
                                slider.style.width = '100%';
                                slider.style.left = '0px';
                                slider.style.right = '0px';
                                break;
                            case 'bottom':
                                slider.style.height = (!param.height ? param.size : 'calc(' + param.defaultSize + ' - ' + param.height + 'px)');
                                slider.style.width = '100%';
                                slider.style.left = '0px';
                                slider.style.right = '0px';
                                break;
                        }

                        if (scope.psOpen) {
                            psOpen(slider, param);
                        } else {
                            psClose(slider, param);
                        }
                    }

                    function psClose(slider, param) {
                        switch (param.side) {
                            case 'right':
                                slider.style.right = get_negative_size(param.size);
                                if (param.push) {
                                    body.style.right = '0px';
                                    body.style.left = '0px';
                                }
                                break;
                            case 'left':
                                slider.style.left = get_negative_size(param.size);
                                if (param.push) {
                                    body.style.left = '0px';
                                    body.style.right = '0px';
                                }
                                break;
                            case 'top':
                                slider.style.top = get_negative_size(param.size);
                                if (param.push) {
                                    body.style.top = '0px';
                                    body.style.bottom = '0px';
                                }
                                break;
                            case 'bottom':
                                slider.style.bottom = get_negative_size(param.size);
                                if (param.push) {
                                    body.style.bottom = '0px';
                                    body.style.top = '0px';
                                }
                                break;
                        }

                        if (param.keyListener) {
                            $document.off('keydown', handleKeyDown);
                        }

                        if (param.clickOutside) {
                            $document.off('touchend click', onBodyClick);
                        }
                        isOpen = false;
                        setBodyClass('closed');
                        scope.psOpen = false;
                    }

                    function psOpen(slider, param) {

                        switch (param.side) {
                            case 'right':
                                slider.style.right = "0px";
                                if (param.push) {
                                    body.style.right = param.size;
                                    body.style.left = get_negative_size(param.size);
                                }
                                break;
                            case 'left':
                                slider.style.left = "0px";
                                if (param.push) {
                                    body.style.left = param.size;
                                    body.style.right = get_negative_size(param.size);
                                }
                                break;
                            case 'top':
                                slider.style.top = param.height + 'px';
                                if (param.push) {
                                    body.style.top = param.size;
                                    body.style.bottom = get_negative_size(param.size);
                                }
                                break;
                            case 'bottom':
                                slider.style.bottom = "0px";
                                if (param.push) {
                                    body.style.bottom = param.size;
                                    body.style.top = get_negative_size(param.size);
                                }
                                break;
                        }

                        scope.psOpen = true;

                        //Run onopen
                        $parse(scope.onopen)();

                        if (param.keyListener) {
                            $document.on('keydown', handleKeyDown);
                        }

                        if (param.clickOutside) {
                            $document.on('touchend click', onBodyClick);
                        }
                        setBodyClass('open');
                    }

                    function handleKeyDown(e) {
                        var ESC_KEY = 27;
                        var key = e.keyCode || e.which;

                        if (key === ESC_KEY) {
                            psClose(slider, param);

                            // FIXME check with tests
                            // http://stackoverflow.com/questions/12729122/angularjs-prevent-error-digest-already-in-progress-when-calling-scope-apply

                            $timeout(function () {
                                scope.$apply();
                            });
                        }
                    }

                    function onunload() {
                        psClose(slider, param);
                    }

                    // Initialize

                    initSlider(slider, param);

                    // Watchers

                    scope.$watch('psOpen', function(value) {
                        if (!!value) {
                            psOpen(slider, param);
                        } else {
                            psClose(slider, param);
                        }
                    });

                    scope.$watch('psSize', function(newValue, oldValue) {
                        if (oldValue !== newValue) {
                            param.size = newValue;
                            initSlider(slider, param);
                        }
                    });

                    // Events

                    scope.$on('$destroy', function () {
                        if (slider.parentNode === body) {
                            if (param.clickOutside) {
                                $document.off('touchend click', onBodyClick);
                            }
                            body.removeChild(slider);
                        }

                        slider.removeEventListener('transitionend', onTransitionEnd);
                        $window.removeEventListener('beforeunload', onunload);
                    });

                    if (param.autoClose) {
                        scope.$on('$locationChangeStart', function() {
                            psClose(slider, param);
                        });
                        scope.$on('$stateChangeStart', function() {
                            psClose(slider, param);
                        });
                        $window.addEventListener('beforeunload', onunload);
                    }

                    if (param.removeHeight) {
                        scope.$watch(function() {

                            return param.removeHeight[0].offsetHeight + param.removeHeight[0].offsetTop;
                        }, function(new_size, old_size) {

                            if (new_size !== old_size ) {
                                calc_height(new_size);
                            }
                        });
                    }
                }
            };
        }]);
}));
