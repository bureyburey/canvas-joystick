function Joystick(options) {
    options = options || {};
    this.stickColor = options.stickColor || "black";
    this.stickBgColor = options.stickBgColor || "red";
    this.stickBg = options.stickBg || "white";
    this.stickOpacity = options.stickOpacity || "0.5";
    
    this.radius = 30;
    this.radiusBorder = this.radius * 1.6;
    this.repositionJoystick = false;
    this.mousePressed = false;
    
    // canvas for the joystick
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.style.backgroundColor = this.stickBg;
    this.canvas.style.opacity = this.stickOpacity;
    this.canvas.style.userSelect = "none";
    this.canvas.width = 100;
    this.canvas.height = 100;
    this.canvas.style.left = window.innerWidth * 0.7 + "px";
    this.canvas.style.top = window.innerHeight * 0.65 + "px";
    
    this.canvas.style.position = "absolute";
    this.canvas.style.border = "1px solid black";
    
    this.initHandlers = function() {
        // bind all handlers
        this.handleStart = this.handleStart.bind(this);
        this.handleMove = this.handleMove.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleEnd = this.handleEnd.bind(this);
        this.getPosition = this.getPosition.bind(this);
    
        this.canvas.addEventListener("touchstart", this.handleStart, false);
        this.canvas.addEventListener("touchend", this.handleEnd, false);
        //this.canvas.addEventListener("touchcancel", this.handleCancel, false);
        this.canvas.addEventListener("touchmove", this.throttle(this.handleMove, 10), false);
    
        this.canvas.addEventListener("mousedown", this.handleStart, false);
        this.canvas.addEventListener("mouseup", this.handleEnd, false);
        this.canvas.addEventListener("mousemove", this.throttle(this.handleMove, 10), false);
    }
    
    this.throttle = function(callback, delay) {
        var previousCallTime = new Date().getTime();
        return function() {
            var currentCallTime = new Date().getTime();

            if ((currentCallTime - previousCallTime) >= delay) {
                previousCallTime = currentCallTime;
                callback.apply(null, arguments);
            }
        };
    }
    
    this.offsets = {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2
    };

    this.drawStick = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.beginPath();
        this.ctx.fillStyle = this.stickBgColor;
        this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, this.radiusBorder, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.fillStyle = this.stickColor;
        this.ctx.arc(this.offsets.x, this.offsets.y, this.radius, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.fill();
    }

    this.getPosition = function(e) {
        // get touches object if exists
        var w = this.canvas.width;
        var h = this.canvas.height;

        var touch = e.changedTouches;

        // calculate offset of canvas
        var offset = this.canvas.getBoundingClientRect();

        var scaleX = w / offset.width;
        var scaleY = h / offset.height;

        var offsetX = offset.left;
        var offsetY = offset.top;

        // get mouse position
        var x = e.clientX;
        var y = e.clientY;
        // get touches if available, otherwise get position from mouse event (default)
        if (touch) {
            x = touch[0].clientX;
            y = touch[0].clientY;
        }

        // return new position with calculated offsets
        return {
            x: (x - offsetX) * scaleX,
            y: (y - offsetY) * scaleY
        }
    }

    this.handleStart = function(e) {
        e.preventDefault();
        this.mousePressed = true;
        
        var pos = this.getPosition(e);
        this.offsets = {
            x: pos.x,
            y: pos.y
        }
        
        var touchX = this.canvas.width / 2 - this.offsets.x;
        var touchY = this.canvas.height / 2 - this.offsets.y;

        var dx = Math.abs(touchX);
        var dy = Math.abs(touchY);
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radiusBorder) {
            this.repositionJoystick = false;
            this.drawStick();
        } else {
            this.repositionJoystick = true;
        }
    }

    this.handleEnd = function(e) {
        this.mousePressed = false;
        this.offsets = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
        this.drawStick();
        return true;
    }

    this.handleCancel = function(e) {}

    this.handleMove = function(e) {
        // prevent default scrolling
        //e.preventDefault();
        if(!this.mousePressed){
            return;
        }
        
        var pos = this.getPosition(e);
        
        if (this.repositionJoystick) {
            var x = pos.x + this.canvas.offsetLeft - this.offsets.x;
            var y = pos.y + this.canvas.offsetTop - this.offsets.y;
            this.canvas.style.left = x + 'px';
            this.canvas.style.top = y + 'px';
        }
        else {
            this.offsets = {
                x: pos.x,
                y: pos.y
            }

            var dx = Math.abs(this.offsets.x - this.canvas.width / 2);
            var dy = Math.abs(this.offsets.y - this.canvas.height / 2);
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this.radiusBorder) {
                var maxX = (this.offsets.x - this.canvas.width / 2) / dist;
                var maxY = (this.offsets.y - this.canvas.height / 2) / dist;

                this.offsets = {
                    x: maxX * this.radius + this.radiusBorder,
                    y: maxY * this.radius + this.radiusBorder
                }
            }

            this.drawStick();
        }
    }

    this.deltaX = function() {
        if (this.repositionJoystick)
            return 0;
        return this.offsets.x - this.canvas.width / 2;
    }
    this.deltaY = function() {
        if (this.repositionJoystick)
            return 0;
        return this.offsets.y - this.canvas.height / 2;
    }
    this.direction = function() {
        var dx = this.deltaX();
        var dy = this.deltaY();
        if (dx > Math.abs(dy) && dx > 0) {
            return "RIGHT";
        }
        if (dy > Math.abs(dx) && dy > 0) {
            return "DOWN";
        }
        if (dx < dy && dx < 0) {
            return "LEFT";
        }
        if (dy < dx && dy < 0) {
            return "UP";
        }
        return "STATIC";
    }

    this.initHandlers();
    document.body.appendChild(this.canvas);
    this.drawStick();
}
