/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io

 * modified by Zander.
 */
import * as THREE from './three.js-master/build/three.module.js';
     export function AstroControls ( object, domElement ) {

    var _this = this;
    var STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

    this.object = object;
    this.domElement = ( domElement !== undefined ) ? domElement : document;
    this.rotationZFactor = 0.0;//1;
    this.RVMovingFactor = 0.0;
    this.autoRotate = false;
    this.autoRotateSpeed = 0.001;
    this.allSpeedsFactor = 1;
    // API

    this.enabled = true;

    this.screen = { left: 0, top: 0, width: 0, height: 0 };

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.2;
    this.panSpeed = 0.3;

    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;

    this.staticMoving = false;
    this.dynamicDampingFactor = 0.2;

    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.keys = [null, null, null]; // [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

    // internals

    this.target = new THREE.Vector3();

    var EPS = 0.000001;

    var lastPosition = new THREE.Vector3();

    var _state = STATE.NONE,
        _prevState = STATE.NONE,

        _eye = new THREE.Vector3(),

        _movePrev = new THREE.Vector2(),
        _moveCurr = new THREE.Vector2(),

        _lastAxis = new THREE.Vector3(),
        _lastAngle = 0,

        _zoomStart = new THREE.Vector2(),
        _zoomEnd = new THREE.Vector2(),

        _touchZoomDistanceStart = 0,
        _touchZoomDistanceEnd = 0,

        _panStart = new THREE.Vector2(),
        _panEnd = new THREE.Vector2();

    // for reset

    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();

    // events

    var changeEvent = { type: 'change' };
    var startEvent = { type: 'start' };
    var endEvent = { type: 'end' };


    // methods

    this.handleResize = function () {

        if ( this.domElement === document ) {

            this.screen.left = 0;
            this.screen.top = 0;
            this.screen.width = window.innerWidth;
            this.screen.height = window.innerHeight;

        } else {

            var box = this.domElement.getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
            var d = this.domElement.ownerDocument.documentElement;
            this.screen.left = box.left + window.pageXOffset - d.clientLeft;
            this.screen.top = box.top + window.pageYOffset - d.clientTop;
            this.screen.width = box.width;
            this.screen.height = box.height;

        }

    };

    var getMouseOnScreen = ( function () {

        var vector = new THREE.Vector2();

        return function getMouseOnScreen( pageX, pageY ) {

            vector.set(
                ( pageX - _this.screen.left ) / _this.screen.width,
                ( pageY - _this.screen.top ) / _this.screen.height
            );

            return vector;

        };

    }() );

    var getMouseOnCircle = ( function () {

        var vector = new THREE.Vector2();

        return function getMouseOnCircle( pageX, pageY ) {

            vector.set(
                ( ( pageX - _this.screen.width * 0.5 - _this.screen.left ) / ( _this.screen.width * 0.5 ) ),
                ( ( _this.screen.height + 2 * ( _this.screen.top - pageY ) ) / _this.screen.width ) // screen.width intentional
            );

            return vector;

        };

    }() );

    this.rotateCamera = ( function () {

        var axis = new THREE.Vector3(),
            quaternion = new THREE.Quaternion(),
            eyeDirection = new THREE.Vector3(),
            objectUpDirection = new THREE.Vector3(),
            objectSidewaysDirection = new THREE.Vector3(),
            moveDirection = new THREE.Vector3(),
            tmpQuaternion = new THREE.Quaternion(),
            angle;

        return function rotateCamera() {
            if (_this.autoRotate) _moveCurr.x += _this.autoRotateSpeed;
            moveDirection.set( _moveCurr.x - _movePrev.x, _moveCurr.y - _movePrev.y, 0 );
            moveDirection.setLength(moveDirection.length() * _this.allSpeedsFactor);
            angle = moveDirection.length();

            if ( angle || _this.rotationZFactor) {

                _eye.copy( _this.object.position ).sub( _this.target );

                eyeDirection.copy( _eye ).normalize();
                objectUpDirection.copy( _this.object.up ).normalize();
                objectSidewaysDirection.crossVectors( objectUpDirection, eyeDirection ).normalize();

                objectUpDirection.setLength( _moveCurr.y - _movePrev.y );
                objectSidewaysDirection.setLength( _moveCurr.x - _movePrev.x );

                moveDirection.copy( objectUpDirection.add( objectSidewaysDirection ) );

                axis.crossVectors( moveDirection, _eye ).normalize();

                angle *= _this.rotateSpeed;
                quaternion.setFromAxisAngle( axis, angle );

                // added for z-axis rotation
                tmpQuaternion.setFromAxisAngle( eyeDirection, _this.rotationZFactor );
                quaternion.multiply( tmpQuaternion );
                // end add

                _eye.applyQuaternion( quaternion );
                _this.object.up.applyQuaternion( quaternion );

                _lastAxis.copy( axis );
                _lastAngle = angle;



            } else if ( ! _this.staticMoving && _lastAngle ) {

                _lastAngle *= Math.sqrt( 1.0 - _this.dynamicDampingFactor * _this.allSpeedsFactor );
                _eye.copy( _this.object.position ).sub( _this.target );
                quaternion.setFromAxisAngle( _lastAxis, _lastAngle );
                _eye.applyQuaternion( quaternion );
                _this.object.up.applyQuaternion( quaternion );

            }

            _movePrev.copy( _moveCurr );
        };

    }() );


    this.zoomCamera = function () {

        var factor;
        if ( _state === STATE.TOUCH_ZOOM_PAN ) {

            factor = _this.allSpeedsFactor * _touchZoomDistanceStart / _touchZoomDistanceEnd;
            _touchZoomDistanceStart = _touchZoomDistanceEnd;
            _eye.multiplyScalar( factor );

        } else {

            factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed * _this.allSpeedsFactor;

            if ( factor !== 1.0 && factor > 0.0 ) {

                _eye.multiplyScalar( factor );

            }

            if ( _this.staticMoving ) {

                _zoomStart.copy( _zoomEnd );

            } else {

                _zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor * _this.allSpeedsFactor;

            }

        }

    };

    this.panCamera = ( function () {

        var mouseChange = new THREE.Vector2(),
            objectUp = new THREE.Vector3(),
            rv = new THREE.Vector3()
        let pan;
        pan = new THREE.Vector3();

        return function panCamera() {

            mouseChange.copy( _panEnd ).sub( _panStart );
            mouseChange.setLength(mouseChange.length() * _this.allSpeedsFactor);

            if ( mouseChange.lengthSq() || _this.RVMovingFactor ) {
                mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );
                pan.copy( _eye ).cross( _this.object.up ).setLength( mouseChange.x );
                pan.add( objectUp.copy( _this.object.up ).setLength( mouseChange.y ) );
                pan.add( rv.copy( _eye ).setLength(_this.RVMovingFactor * _eye.length()) );
                _this.object.position.add( pan );
                _this.target.add( pan );

                if ( _this.staticMoving ) {

                    _panStart.copy( _panEnd );

                } else {

                    _panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor * _this.allSpeedsFactor ) );

                }

            }

        };

    }() );

    this.checkDistances = function () {

        if ( ! _this.noZoom || ! _this.noPan ) {

            if ( _eye.lengthSq() > _this.maxDistance * _this.maxDistance ) {

                _this.object.position.addVectors( _this.target, _eye.setLength( _this.maxDistance ) );
                _zoomStart.copy( _zoomEnd );

            }

            if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

                _this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );
                _zoomStart.copy( _zoomEnd );

            }

        }

    };

    this.update = function () {

        _eye.subVectors( _this.object.position, _this.target );

        if ( ! _this.noRotate ) {

            _this.rotateCamera();

        }

        if ( ! _this.noZoom ) {

            _this.zoomCamera();

        }

        if ( ! _this.noPan ) {

            _this.panCamera();

        }

        _this.object.position.addVectors( _this.target, _eye );

        _this.checkDistances();

        _this.object.lookAt( _this.target );

        if ( lastPosition.distanceToSquared( _this.object.position ) > EPS ) {

            _this.dispatchEvent( changeEvent );

            lastPosition.copy( _this.object.position );

        }
        _this.RVMovingFactor = 0.0;
        _this.rotationZFactor = 0.0;

    };

    this.reset = function () {

        _state = STATE.NONE;
        _prevState = STATE.NONE;

        _this.target.copy( _this.target0 );
        _this.object.position.copy( _this.position0 );
        _this.object.up.copy( _this.up0 );

        _eye.subVectors( _this.object.position, _this.target );

        _this.object.lookAt( _this.target );

        _this.dispatchEvent( changeEvent );

        lastPosition.copy( _this.object.position );

    };

    // listeners

    function keydown( event ) {

        if ( _this.enabled === false ) return;

        //window.removeEventListener( 'keydown', keydown );

        _prevState = _state;
        /**
         if ( _state !== STATE.NONE ) {

			return;

		} else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && ! _this.noRotate ) {

			_state = STATE.ROTATE;

		} else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && ! _this.noZoom ) {

			_state = STATE.ZOOM;

		} else if ( event.keyCode === _this.keys[ STATE.PAN ] && ! _this.noPan ) {

			_state = STATE.PAN;

		}
         **/

        switch (event.keyCode) {
            // 81:Q; 87:W; 69:E; 82:R;
            // 65:A; 83:S; 68:D; 70:F;
            // 90:Z; 88:X; 67:C; 86:V;
            // 107:+; 109:-; 16:Shift; 17:Ctrl; 18:Alt; 9:Tab;
            // 38:Up; 37:Left; 40:Down; 39:Right;
            case 87:
                _this.RVMovingFactor = -0.002 * _this.allSpeedsFactor;//W
                break;
            case 83:
                _this.RVMovingFactor = 0.002 * _this.allSpeedsFactor;//S
                break;
            case 65:
                _movePrev.copy( _moveCurr );
                _moveCurr.x -= 0.01 * _this.allSpeedsFactor; //A
                break;
            case 68:
                _movePrev.copy( _moveCurr );
                _moveCurr.x += 0.01 * _this.allSpeedsFactor; //D
                break;
            case 90:
                _movePrev.copy( _moveCurr );
                _moveCurr.y -= 0.01 * _this.allSpeedsFactor;  //Z
                break;
            case 88:
                _movePrev.copy( _moveCurr );
                _moveCurr.y += 0.01 * _this.allSpeedsFactor;  //X
                break;
            case 81:
                _this.rotationZFactor = -0.01 * _this.allSpeedsFactor;//Q
                break;
            case 69:
                _this.rotationZFactor = 0.01 * _this.allSpeedsFactor;//E
                break;
            case 107:
                _zoomStart.y += 0.02 * _this.allSpeedsFactor; // +
                break;
            case 109:
                _zoomStart.y -= 0.02 * _this.allSpeedsFactor; // -
                break;
            case 38:  // up
                _panEnd.y -= 0.01 * _this.allSpeedsFactor;
                break;
            case 40: // down
                _panEnd.y += 0.01 * _this.allSpeedsFactor;
                break;
            case 37: // left
                _panEnd.x -= 0.01 * _this.allSpeedsFactor;
                break;
            case 39: // right
                _panEnd.x += 0.01 * _this.allSpeedsFactor;
                break;
            case 82: // R
                _this.allSpeedsFactor = 0.33;
                break;
            case 16: // Shift
                _this.allSpeedsFactor = 0.05;
                break;
        }
    }

    function keyup( event ) {

        if ( _this.enabled === false ) return;
        switch (event.keyCode) {
            // 81:Q; 87:W; 69:E; 82:R;
            // 65:A; 83:S; 68:D; 70:F;
            // 90:Z; 88:X; 67:C; 86:V;
            // 107:+; 109:-; 16:Shift; 17:Ctrl; 18:Alt; 9:Tab;
            // 38:Up; 37:Left; 40:Down; 39:Right;
            case 87: // W
                _this.RVMovingFactor = 0.0;
                break;
            case 83: // S
                _this.RVMovingFactor = 0.0;
                break;
            case 81: // Q
                _this.rotationZFactor = 0.0;
                break;
            case 69: // E
                _this.rotationZFactor = 0.0;
                break;
            case 82: // R
                _this.allSpeedsFactor = 1.0;
                break;
            case 16: // Shift
                _this.allSpeedsFactor = 1.0;
                break;
        }
        _state = _prevState;

        //window.addEventListener( 'keydown', keydown, false );

    }

    function mousedown( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        if ( _state === STATE.NONE ) {

            _state = event.button;

        }

        if ( _state === STATE.ROTATE && ! _this.noRotate ) {

            _moveCurr.copy( getMouseOnCircle( event.pageX, event.pageY ) );
            _movePrev.copy( _moveCurr );

        } else if ( _state === STATE.ZOOM && ! _this.noZoom ) {

            _zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            _zoomEnd.copy( _zoomStart );

        } else if ( _state === STATE.PAN && ! _this.noPan ) {

            _panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
            _panEnd.copy( _panStart );

        }

        document.addEventListener( 'mousemove', mousemove, false );
        document.addEventListener( 'mouseup', mouseup, false );

        _this.dispatchEvent( startEvent );

    }

    function mousemove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        if ( _state === STATE.ROTATE && ! _this.noRotate ) {

            _movePrev.copy( _moveCurr );
            _moveCurr.copy( getMouseOnCircle( event.pageX, event.pageY ) );

        } else if ( _state === STATE.ZOOM && ! _this.noZoom ) {

            _zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

        } else if ( _state === STATE.PAN && ! _this.noPan ) {

            _panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

        }

    }

    function mouseup( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        _state = STATE.NONE;

        document.removeEventListener( 'mousemove', mousemove );
        document.removeEventListener( 'mouseup', mouseup );
        _this.dispatchEvent( endEvent );

    }

    function mousewheel( event ) {

        if ( _this.enabled === false ) return;

        if ( _this.noZoom === true ) return;

        event.preventDefault();
        event.stopPropagation();

        switch ( event.deltaMode ) {

            case 2:
                // Zoom in pages
                _zoomStart.y -= event.deltaY * 0.025 * _this.allSpeedsFactor;
                break;

            case 1:
                // Zoom in lines
                _zoomStart.y -= event.deltaY * 0.01 * _this.allSpeedsFactor;
                break;

            default:
                // undefined, 0, assume pixels
                _zoomStart.y -= event.deltaY * 0.00025 * _this.allSpeedsFactor;
                break;

        }

        _this.dispatchEvent( startEvent );
        _this.dispatchEvent( endEvent );

    }

    function touchstart( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {

            case 1:
                _state = STATE.TOUCH_ROTATE;
                _moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                _movePrev.copy( _moveCurr );
                break;

            default: // 2 or more
                _state = STATE.TOUCH_ZOOM_PAN;
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _panStart.copy( getMouseOnScreen( x, y ) );
                _panEnd.copy( _panStart );
                break;

        }

        _this.dispatchEvent( startEvent );

    }

    function touchmove( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();
        event.stopPropagation();

        switch ( event.touches.length ) {

            case 1:
                _movePrev.copy( _moveCurr );
                _moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                break;

            default: // 2 or more
                var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
                var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
                _touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

                var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
                var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
                _panEnd.copy( getMouseOnScreen( x, y ) );
                break;

        }

    }

    function touchend( event ) {

        if ( _this.enabled === false ) return;

        switch ( event.touches.length ) {

            case 0:
                _state = STATE.NONE;
                break;

            case 1:
                _state = STATE.TOUCH_ROTATE;
                _moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
                _movePrev.copy( _moveCurr );
                break;

        }

        _this.dispatchEvent( endEvent );

    }

    function contextmenu( event ) {

        if ( _this.enabled === false ) return;

        event.preventDefault();

    }

    this.dispose = function () {

        this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
        this.domElement.removeEventListener( 'mousedown', mousedown, false );
        this.domElement.removeEventListener( 'wheel', mousewheel, false );

        this.domElement.removeEventListener( 'touchstart', touchstart, false );
        this.domElement.removeEventListener( 'touchend', touchend, false );
        this.domElement.removeEventListener( 'touchmove', touchmove, false );

        document.removeEventListener( 'mousemove', mousemove, false );
        document.removeEventListener( 'mouseup', mouseup, false );

        window.removeEventListener( 'keydown', keydown, false );
        window.removeEventListener( 'keyup', keyup, false );

    };

    this.domElement.addEventListener( 'contextmenu', contextmenu, false );
    this.domElement.addEventListener( 'mousedown', mousedown, false );
    this.domElement.addEventListener( 'wheel', mousewheel, false );

    this.domElement.addEventListener( 'touchstart', touchstart, false );
    this.domElement.addEventListener( 'touchend', touchend, false );
    this.domElement.addEventListener( 'touchmove', touchmove, false );

    window.addEventListener( 'keydown', keydown, false );
    window.addEventListener( 'keyup', keyup, false );

    this.handleResize();

    // force an update at start
    this.update();

};

AstroControls.prototype = Object.create( THREE.EventDispatcher.prototype );
AstroControls.prototype.constructor = AstroControls;