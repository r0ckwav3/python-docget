'use babel';

import PythonDocgetView from './python-docget-view';
import { CompositeDisposable, Disposable } from 'atom';

export default {

  subscriptions: null,
  mainPythonDocgetView: null,

  activate(state) {this.subscriptions = new CompositeDisposable(
      atom.workspace.addOpener(uri => {
        if (uri === PythonDocgetView.URI) {
          return new PythonDocgetView();
        }
      }),

      atom.commands.add('atom-workspace', {
        'python-docget:toggle': () => this.toggle(),
        'python-docget:search': () => this.selectionSearch()
      }),

      // Destroy any PythonDocgetViews when the package is deactivated.
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach(item => {
          if (item instanceof PythonDocgetView) {
            item.destroy();
          }
        });
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  // serialize() {
  //   return {
  //     pythonDocgetViewState: this.pythonDocgetView.serialize()
  //   };
  // },

  toggle() {
    atom.workspace.toggle(PythonDocgetView.URI);
  },

  selectionSearch() { // this feels a bit hacky
    const editor = atom.workspace.getActiveTextEditor()
    if (editor) {
      const searchterm = editor.getSelectedText()
      this.search(searchterm)
    }
  },

  search(searchterm) {
    foundone = false
    atom.workspace.getPaneItems().forEach(item => {
      if (item instanceof PythonDocgetView) {
        foundone = true
        item.search(searchterm)
      }
    });
    if(!foundone){
      this.toggle()
      //TODO: search after this
    }
  },

  deserializePythonDocgetView() {
    return new PythonDocgetView();
  }

};
