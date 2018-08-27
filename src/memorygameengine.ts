class MemoryGameEngine {

  /**
   * private 
   */
    private readonly EMPTY: string = '';
    private readonly DIV: string = 'div';
    private readonly CLICK: string = 'click';
    private readonly CREATED_EVENT_NAME: string = ':created';
    private readonly STARTED_EVENT_NAME: string = ':started';
    private readonly ATTEMPT_EVENT_NAME: string = ':attempt';
    private readonly OVER_EVENT_NAME: string = ':over';
    private readonly END_EVENT_NAME: string = ':end';
  
    private _cssClassName: string = '';
    private _picks: Array<number> = new Array();
    private _solved: Array<number> = new Array();
    private _level: number = 2;
    private _resetDelay: number = 299;
    private _started: number = 0;
    private _ended: number = 0;
    private _closeToken: number = -1;
    private _requestClose: boolean = false;
  /**
   * public
   */  
    public readonly VERSION: string = '1.0.1'; 
    public readonly NAME: string = 'MemoryGameEngine';
    public readonly ALIAS: string = 'mge';
    public readonly DESCRIPTION: string = 'An engine for memory game building.';  
    public container: HTMLElement;
    public board: HTMLElement = document.createElement(this.DIV);
    public cards: Array<HTMLElement>;
    public attempts: number = 0;
  
  /**
   * constructor
   */  
    constructor(container: HTMLElement, cards: Array<HTMLElement>, resetDelay: number = -1, level: number = 2, cssClassName: string = '') {
      this.container = container;
      this._cssClassName = cssClassName;
      this.cards = cards;
      this._level = level;
      this._resetDelay = resetDelay < 300 ? -1 : resetDelay;
      cards.forEach((v, i) => {
        for (let i = 2; i <= this._level; i++)
          this.cards.push(<HTMLElement>v.cloneNode(true));
      });
      let createdEvent: CustomEvent = new CustomEvent(this.ALIAS + this.CREATED_EVENT_NAME);
      this.container.dispatchEvent(createdEvent);
    }
  
  /**
   * de-constructor
   */  
  public end() {
    this._level = 2;
    this._resetDelay = -1;
    this.cards = [];
    this.attempts = 0;
    this.container.innerHTML = '';
    this.container = null;
  }
    
  /**
   * start game
   */  
    public start(): void {     
        /**
        * shuffles cards
        */  
      let shuffle = <T>(arr: Array<T>): Array<T> => {
        if (arr.length <= 1)
          return arr;
        let next = (floor: number, ceiling: number): number => {
          return Math.floor(Math.random() * (ceiling - floor + 1)) + floor;
        };
        arr.forEach((v: T, i: number) => {
          const rndIdx = next(i, arr.length - 1);
          [arr[i], arr[rndIdx]] = [arr[rndIdx], arr[i]];
        });
        return arr;
      }
      shuffle(this.cards);

      this.attempts = 0;
      this.board = document.createElement(this.DIV);
      this.board.classList.add(this._cssClassName);
      this.cards.forEach((v, i) => {
        let slot = document.createElement(this.DIV);
        slot.tabIndex = i;
        this.board.appendChild(slot);
      });
      this.container.appendChild(this.board);
      this.board.addEventListener(this.CLICK, (event) => this.click(event));
      this._started = (new Date()).getTime();
  
      let startedEvent: CustomEvent = new CustomEvent(this.ALIAS + this.STARTED_EVENT_NAME, { detail: this._started });
      this.container.dispatchEvent(startedEvent);
    }

  /**
   * handle slot click
   */      
    public click(event: Event): void {
      if (this._closeToken > -1) {
        clearTimeout(this._closeToken);
        this._requestClose = true;
        this.closePicks();
      }
      else if (this._requestClose) {
        this.closePicks();
      }
      let el: HTMLElement = <HTMLElement>event.target;
      let isCard = (el: HTMLElement): boolean => {
        return el.parentElement !== null && el.parentElement.isEqualNode(this.board);
      };

      if (this._picks.length === this._level || !isCard(el) || el.children.length > 0)
        return;

      let card = this.cards[el.tabIndex];
      this._picks.push(el.tabIndex);
      el.appendChild(card);
  
      if (this._picks.length === this._level)
        this.eval();    
    }

  /**
   * evaluate picks
   */      
    private eval(): void {
      /**
       * test and handle pick equality
       */
      if (this._picks.length === this._level) {
        let arePicksEqual = (): boolean => {
          let result: boolean = false;
          let firstCard = this.cards[this._picks[0]];
          return this._picks.every((v, i) => {
            return firstCard.isEqualNode(this.cards[this._picks[i]]);
          });
        };
      /**
       * marks picks as solved and reset picks
       */      
        let markPicksAsSolved = (): void => {
          if (this._picks.length !== this._level) {
            return;
          }
          this._picks.forEach((v, i) => {
            this._solved.push(v);
          });
          this._picks = new Array();
        };
      /**
       * test picks
       */      
        if (arePicksEqual()) {
          markPicksAsSolved();
        } else {
          if (this._resetDelay < 300) {
            this._requestClose = true;
          } else {
            this._closeToken = setTimeout(() => {
              this._requestClose = true;
              this.closePicks();
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
        let time = this._ended - this._started;
      /**
       * time formatter
       */
        let formatTime = (time: number, includeMilliseconds: boolean = false) => {
          let h: number = 0, m: number = 0, s: number = 0, ms: number = 0;
          h = Math.floor(time / (60 * 60 * 1000));
          time = time % (60 * 60 * 1000);
          m = Math.floor(time / (60 * 1000));
          time = time % (60 * 1000);
          s = Math.floor(time / 1000);
          ms = time % 1000;
          let pad = (num: number, size: number) => {
            let s = '0000' + num;
            return s.substr(s.length - size);            
          };
          let result = pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2);
          if (includeMilliseconds)
            result = result + ':' + pad(ms, 3);
          return result;
        };
      /**
       * game over handler
       */
        let overEvent: CustomEvent = new CustomEvent(this.ALIAS + this.OVER_EVENT_NAME, {
          detail: {
            attempts: this.attempts,
            ellapsedMillisecods: time,
            displayTime: formatTime(time, false)
          }
        });
        this.container.dispatchEvent(overEvent);
      }
    }
  
  /**
   * close picks and reset
   */      
    private closePicks(): void {
      if (this._picks.length !== this._level)
        return;
      this._picks.forEach((v, i) => {
        this.board.children[this._picks[i]].innerHTML = this.EMPTY;
      });
      this._requestClose = false;
      this._picks = new Array();
    }
  
  }
  