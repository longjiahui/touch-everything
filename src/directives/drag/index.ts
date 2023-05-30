import { Touch } from './base'
import {
    DirectiveContext,
    ContextParams,
    ContextManager,
    DirectiveContextElement,
} from './context'
import type { App } from 'vue'

class DragDirectiveContext extends DirectiveContext {
    touch: Touch
    constructor(params: ContextParams) {
        super(params)
        this.touch = new Touch()
        this.touch.on('dragging', (el, movment) => {
            el.style.top = movment.offsetY + 'px'
            el.style.left = movment.offsetX + 'px'
        })
    }
}

class DragContextManager extends ContextManager<DragDirectiveContext> {
    createByElement(el: HTMLElement): DragDirectiveContext {
        return new DragDirectiveContext({ el })
    }
    releaseByElement(el: DirectiveContextElement): void {
        const ctx = this.upsertByElement(el)
        ctx.touch.release()
    }
}

const manager = new DragContextManager()

export default {
    install(app: App) {
        app.directive(
            'drag',
            (() => {
                return {
                    mounted(el) {
                        const ctx = manager.upsertByElement(el)
                        ctx.touch.bind(el)
                    },
                    updated(el) {
                        const ctx = manager.upsertByElement(el)
                        ctx.touch.bind(el)
                    },
                    beforeUnmount(el) {
                        manager.releaseByElement(el)
                    },
                }
            })(),
        )
    },
}
