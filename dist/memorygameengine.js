var MemoryGameEngine = /** @class */ (function () {
    /**
     * constructor
     */
    function MemoryGameEngine(container, cards, resetDelay, level, cssClassName) {
        if (resetDelay === void 0) { resetDelay = -1; }
        if (level === void 0) { level = 2; }
        if (cssClassName === void 0) { cssClassName = ''; }
        var _this = this;
        /**
         * private
         */
        this.EMPTY = '';
        this.DIV = 'div';
        this.CLICK = 'click';
        this.CREATED_EVENT_NAME = ':created';
        this.STARTED_EVENT_NAME = ':started';
        this.ATTEMPT_EVENT_NAME = ':attempt';
        this.OVER_EVENT_NAME = ':over';
        this.END_EVENT_NAME = ':end';
        this._cssClassName = '';
        this._picks = new Array();
        this._solved = new Array();
        this._level = 2;
        this._resetDelay = 299;
        this._started = 0;
        this._ended = 0;
        this._closeToken = -1;
        this._requestClose = false;
        /**
         * public
         */
        this.VERSION = '1.0.0.1';
        this.NAME = 'MemoryGameEngine';
        this.ALIAS = 'mge';
        this.DESCRIPTION = 'An engine for memory game building.';
        this.board = document.createElement(this.DIV);
        this.attempts = 0;
        this.container = container;
        this._cssClassName = cssClassName;
        this.cards = cards;
        this._level = level;
        this._resetDelay = resetDelay < 300 ? -1 : resetDelay;
        cards.forEach(function (v, i) {
            for (var i_1 = 2; i_1 <= _this._level; i_1++)
                _this.cards.push(v.cloneNode(true));
        });
        var createdEvent = new CustomEvent(this.ALIAS + this.CREATED_EVENT_NAME);
        this.container.dispatchEvent(createdEvent);
    }
    /**
     * de-constructor
     */
    MemoryGameEngine.prototype.end = function () {
        this._level = 2;
        this._resetDelay = -1;
        this.cards = [];
        this.attempts = 0;
        this.container.innerHTML = '';
        this.container = null;
    };
    /**
     * start game
     */
    MemoryGameEngine.prototype.start = function () {
        var _this = this;
        /**
        * shuffles cards
        */
        var shuffle = function (arr) {
            if (arr.length <= 1)
                return arr;
            var next = function (floor, ceiling) {
                return Math.floor(Math.random() * (ceiling - floor + 1)) + floor;
            };
            arr.forEach(function (v, i) {
                var _a;
                var rndIdx = next(i, arr.length - 1);
                _a = [arr[rndIdx], arr[i]], arr[i] = _a[0], arr[rndIdx] = _a[1];
            });
            return arr;
        };
        shuffle(this.cards);
        this.attempts = 0;
        this.board = document.createElement(this.DIV);
        this.board.classList.add(this._cssClassName);
        this.cards.forEach(function (v, i) {
            var slot = document.createElement(_this.DIV);
            slot.tabIndex = i;
            _this.board.appendChild(slot);
        });
        this.container.appendChild(this.board);
        this.board.addEventListener(this.CLICK, function (event) { return _this.click(event); });
        this._started = (new Date()).getTime();
        var startedEvent = new CustomEvent(this.ALIAS + this.STARTED_EVENT_NAME, { detail: this._started });
        this.container.dispatchEvent(startedEvent);
    };
    /**
     * handle slot click
     */
    MemoryGameEngine.prototype.click = function (event) {
        var _this = this;
        if (this._closeToken > -1) {
            clearTimeout(this._closeToken);
            this._requestClose = true;
            this.closePicks();
        }
        else if (this._requestClose) {
            this.closePicks();
        }
        var el = event.target;
        var isCard = function (el) {
            return el.parentElement !== null && el.parentElement.isEqualNode(_this.board);
        };
        if (this._picks.length === this._level || !isCard(el) || el.children.length > 0)
            return;
        var card = this.cards[el.tabIndex];
        this._picks.push(el.tabIndex);
        el.appendChild(card);
        if (this._picks.length === this._level)
            this.eval();
    };
    /**
     * evaluate picks
     */
    MemoryGameEngine.prototype.eval = function () {
        var _this = this;
        /**
         * test and handle pick equality
         */
        if (this._picks.length === this._level) {
            var arePicksEqual = function () {
                var result = false;
                var firstCard = _this.cards[_this._picks[0]];
                return _this._picks.every(function (v, i) {
                    return firstCard.isEqualNode(_this.cards[_this._picks[i]]);
                });
            };
            /**
             * marks picks as solved and reset picks
             */
            var markPicksAsSolved = function () {
                if (_this._picks.length !== _this._level) {
                    return;
                }
                _this._picks.forEach(function (v, i) {
                    _this._solved.push(v);
                });
                _this._picks = new Array();
            };
            /**
             * test picks
             */
            if (arePicksEqual()) {
                markPicksAsSolved();
            }
            else {
                if (this._resetDelay < 300) {
                    this._requestClose = true;
                }
                else {
                    this._closeToken = setTimeout(function () {
                        _this._requestClose = true;
                        _this.closePicks();
                    }, this._resetDelay);
                }
            }
            /**
             * increment attempts
             */
            this.attempts++;
        }
        /**
         * test and has ended
         */
        if (this.cards.length === this._solved.length) {
            /**
             * handle has ended
             */
            this._ended = (new Date()).getTime();
            var time = this._ended - this._started;
            /**
             * time formatter
             */
            var formatTime = function (time, includeMilliseconds) {
                if (includeMilliseconds === void 0) { includeMilliseconds = false; }
                var h = 0, m = 0, s = 0, ms = 0;
                h = Math.floor(time / (60 * 60 * 1000));
                time = time % (60 * 60 * 1000);
                m = Math.floor(time / (60 * 1000));
                time = time % (60 * 1000);
                s = Math.floor(time / 1000);
                ms = time % 1000;
                var pad = function (num, size) {
                    var s = '0000' + num;
                    return s.substr(s.length - size);
                };
                var result = pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2);
                if (includeMilliseconds)
                    result = result + ':' + pad(ms, 3);
                return result;
            };
            /**
             * game over handler
             */
            var overEvent = new CustomEvent(this.ALIAS + this.OVER_EVENT_NAME, {
                detail: {
                    attempts: this.attempts,
                    ellapsedMillisecods: time,
                    displayTime: formatTime(time, false)
                }
            });
            this.container.dispatchEvent(overEvent);
        }
    };
    /**
     * close picks and reset
     */
    MemoryGameEngine.prototype.closePicks = function () {
        var _this = this;
        if (this._picks.length !== this._level)
            return;
        this._picks.forEach(function (v, i) {
            _this.board.children[_this._picks[i]].innerHTML = _this.EMPTY;
        });
        this._requestClose = false;
        this._picks = new Array();
    };
    return MemoryGameEngine;
}());
