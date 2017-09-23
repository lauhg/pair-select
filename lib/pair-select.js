'use babel'

import { CompositeDisposable } from 'atom'

// let log = console.log.bind(console)
function log() {}

export default {

  subscriptions: null,

  activate(state) {

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pair-select:select-inside-pair': () => this.selectInsidePair()
    }))
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  serialize() {

  },

  selectInsidePair() {
    let editor = atom.workspace.getActiveTextEditor()
    log('selectInsidePair')
    let pos = editor.getCursorBufferPosition()
    let row = pos.row
    let col = pos.column
    log('col', col, typeof(col))
    let text = editor.lineTextForBufferRow(row)
    log(`(${text})`)
    log(text)

    let filter = this.pairsIndexOfText(text).filter(x => (col - x[0]) >= 0 && (col - x[1]) <= 0)
    if (filter.length == 0) {
      return
    }
    let sort = filter.sort((a, b) => a[0] - b[0])
    let [l, r] = sort[sort.length - 1]

    editor.setSelectedBufferRange([[row, l+1], [row, r]])

    log('filter', filter)
    log('sort', sort)

  },

  pairsIndexOfText(text) {
    let result = []
    let quoteStack = []
    let bracketStack = []

    for (let i = 0; i < text.length; i++) {
      let e = text[i]
      if (['(', ')', '[', ']', '\'', "'"].includes(e)) {
        log(e, i)
      }

      if (['(', '[', '{'].includes(e)) {
        if (quoteStack.length > 0) {
          continue
        }
        bracketStack.push([e, i])

      } else if ([')', ']', '}'].includes(e)) {
        if (quoteStack.length > 0 || bracketStack.length == 0) {
          continue
        }
        let l = bracketStack.pop()[1]
        let r = i
        result.push([l, r])

      } else if (['"', "'", '`'].includes(e)) {
        let topElem = quoteStack[quoteStack.length - 1]

        if (quoteStack.length > 0 && topElem[0] == e) {
          if (text[i-1] == '\\' && text[i-2] != '\\') {
            log('continue')
            continue
          }
          let l = quoteStack.pop()[1]
          let r = i
          result.push([l, r])

        } else if (quoteStack.length == 0){
          quoteStack.push([e, i])
        }
      }
    }

    return result
  },

}
