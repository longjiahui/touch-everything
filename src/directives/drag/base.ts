import { EventEmitter } from 'events'
import { ref } from 'vue'

export class Rect {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number,
    ) {}

    get minx() {
        return this.x
    }
    get maxx() {
        return this.x + this.width
    }
    get miny() {
        return this.y
    }
    get maxy() {
        return this.y + this.height
    }
    include(point: [number, number]) {
        const [x, y] = point
        return (
            x >= this.minx && x >= this.maxx && y >= this.miny && y <= this.maxy
        )
    }
    includes(points: [number, number][]) {
        return points.every((p) => this.include(p))
    }
    limit(point: [number, number]) {
        const [x, y] = point
        return [
            Math.min(Math.max(this.minx, x), this.maxx),
            Math.min(Math.max(this.miny, y), this.maxy),
        ]
    }
}

interface TouchOptions {
    limit?: HTMLElement | null
}

export class Touch extends EventEmitter<{
    touching: [inst: Touch]
    dragging: [
        inst: HTMLElement,
        movement: {
            offsetX: number
            offsetY: number
            movementX: number
            movementY: number
        },
    ]
}> {
    isTouching = ref(false)
    el: HTMLElement | undefined

    handleTouchStart = () => {
        this.isTouching.value = true
        this.prevTouchingEvent = null
        this.offsetX = this.offsetLeft
        this.offsetY = this.offsetTop
    }

    prevTouchingEvent: MouseEvent | TouchEvent | null = null

    offsetX = 0
    offsetY = 0

    get offsetLeft() {
        return this.el?.offsetLeft || 0
    }
    get offsetTop() {
        return this.el?.offsetTop || 0
    }
    get offsetWidth() {
        return this.el?.offsetWidth || 0
    }
    get offsetHeight() {
        return this.el?.offsetHeight || 0
    }
    handleTouching = (e: MouseEvent | TouchEvent) => {
        if (this.isTouching.value) {
            this.emit('touching', this)
            if (this.listeners('dragging').length > 0) {
                // 计算movement
                let movementX = 0,
                    movementY = 0
                if (this.prevTouchingEvent) {
                    const { pageX, pageY } =
                        e instanceof MouseEvent ? e : e.touches[0]
                    const { pageX: prevPageX, pageY: prevPageY } =
                        this.prevTouchingEvent instanceof MouseEvent
                            ? this.prevTouchingEvent
                            : this.prevTouchingEvent.touches[0]
                    movementX = pageX - prevPageX
                    movementY = pageY - prevPageY
                }
                // if (this.options.limit) {
                //     const { clientX, clientY } =
                //         e instanceof MouseEvent ? e : e.touches[0]
                //     // 检测元素是否到达边界，同时检测鼠标位置是否到达边界则不再修改offset
                //     const limitRect = new Rect(
                //         getElementViewLeft(this.options.limit),
                //         getElementViewTop(this.options.limit),
                //         this.options.limit.clientWidth,
                //         this.options.limit.clientHeight,
                //     )
                //     if (
                //         limitRect.includes([
                //             [clientX, clientY],
                //             [this.offsetX, this.offsetY],
                //         ])
                //     ) {
                //         this.offsetX += movementX
                //         this.offsetY += movementY
                //         const limit = limitRect.limit([
                //             this.offsetX,
                //             this.offsetY,
                //         ])
                //         this.offsetX = limit[0]
                //         this.offsetY = limit[1]
                //     }
                // } else {
                this.offsetX += movementX
                this.offsetY += movementY
                // }
                if (this.el) {
                    this.emit('dragging', this.el, {
                        movementX,
                        movementY,
                        offsetX: this.offsetX,
                        offsetY: this.offsetY,
                    })
                } else {
                    console.warn(
                        'something went wrong cause this[Touch].el is empty',
                    )
                }
            }
            this.prevTouchingEvent = e
            e.preventDefault()
        }
    }
    handleTouchEnd = () => {
        if (this.isTouching.value) {
            this.isTouching.value = false
            this.prevTouchingEvent = null
        }
    }

    options: TouchOptions = {}
    constructor(options: TouchOptions = {}) {
        super()
        this.options = Object.assign({}, options)
    }

    bind(el: HTMLElement) {
        if (!this.el) {
            el.addEventListener('touchstart', this.handleTouchStart)
            document.addEventListener('touchmove', this.handleTouching, {
                passive: false,
            })
            document.addEventListener('touchend', this.handleTouchEnd)
            el.addEventListener('mousedown', this.handleTouchStart)
            document.addEventListener('mousemove', this.handleTouching, {
                passive: false,
            })
            document.addEventListener('mouseup', this.handleTouchEnd)
        } else if (this.el !== el) {
            this.release()
            if (el) {
                this.bind(el)
            }
        } else {
            // equal do nothing
        }
        this.el = el
    }

    release() {
        if (this.el) {
            this.el.removeEventListener('touchstart', this.handleTouchStart)
            this.el.removeEventListener('mousedown', this.handleTouchStart)
            document.removeEventListener('touchmove', this.handleTouching)
            document.removeEventListener('mousemove', this.handleTouching)
            document.removeEventListener('touchend', this.handleTouchEnd)
            document.removeEventListener('mouseup', this.handleTouchEnd)
        }
        this.el = undefined
    }
}
