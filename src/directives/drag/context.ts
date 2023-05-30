import shortid from 'shortid'

const KEY_ID = 'deid'
export interface ContextParams {
    el: HTMLElement

    id?: string
}
export type DirectiveContextElement = HTMLElement & { [KEY_ID]: string }
export abstract class DirectiveContext {
    id: string
    el: HTMLElement
    constructor(params: ContextParams) {
        this.el = params.el
        this.id = params.id || shortid.generate()
        Object.assign(this, params)
    }
}

export abstract class ContextManager<Context extends DirectiveContext> {
    contexts: Record<string, DirectiveContext> = {}
    _registerContext(context: Context) {
        this.contexts[context.id] = context
    }
    get(id: string) {
        return this.contexts[id] as Context
    }
    upsertByElement(el: DirectiveContextElement) {
        let ctx = this.contexts[el[KEY_ID]]
        if (!ctx) {
            ctx = this.createByElement(el)
        }
        return ctx as Context
    }
    abstract releaseByElement(el: DirectiveContextElement): void
    abstract createByElement(el: HTMLElement): Context
}
