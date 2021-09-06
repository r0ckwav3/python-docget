'use babel';

import PythonDocgetData from './python-docget-data';
import { TextEditor } from 'atom';

export default class PythonDocgetView {

  static URI = 'atom://python-docget-panel';

  constructor(serializedState) {

    // Create root element
    this.element = document.createElement('div')
    this.element.classList.add('python-docget')

    // Create header element
    headerdiv = document.createElement('div')
    headerdiv.classList.add('python-docget-header')
    this.element.appendChild(headerdiv)

    message = document.createElement('h1')
    message.classList.add('section-heading')
    message.textContent = 'Python Docs'
    headerdiv.appendChild(message)

    searchdiv = document.createElement('div')
    searchdiv.classList.add('input-block')
    headerdiv.appendChild(searchdiv)

    this.searchEditor = new TextEditor({mini: true, placeholderText: 'Search python docs'})
    this.searchEditor.getElement().classList.add('input-editor')
    searchdiv.appendChild(this.searchEditor.getElement())

    this.searchButton = document.createElement('button')
    this.searchButton.classList.add('btn')
    this.searchButton.textContent = 'Search'
    searchdiv.appendChild(this.searchButton)

    // searchbar = document.createElement('input')
    // searchbar.setAttribute("type","text")
    // searchbar.setAttribute("placeholder","search python docs")
    // searchbar.classList.add('python-docget-header')
    // searchbar.classList.add('searchbar')
    // this.element.appendChild(searchbar)

    // this.subscriptions = atom.workspace.getCenter().observeActivePaneItem(item => {
    //   if (!atom.workspace.isTextEditor(item)) {
    //     this.message.innerText = 'Open a file to see important information about it.';
    //     return;
    //   }
    //   this.message.innerHTML = `
    //     <h2>${item.getFileName() || 'untitled'}</h2>
    //     <ul>
    //       <li><b>Soft Wrap:</b> ${item.softWrapped}</li>
    //       <li><b>Tab Length:</b> ${item.getTabLength()}</li>
    //       <li><b>Encoding:</b> ${item.getEncoding()}</li>
    //       <li><b>Line Count:</b> ${item.getLineCount()}</li>
    //     </ul>
    //   `;
    // });
  }

  search(searchterm) {
    this.clearElement()

    message = document.createElement('div')
    message.innerHTML = "<h2>Loading Data</h2>"
    message.classList.add('panel-contents')
    this.element.appendChild(message)

    PythonDocgetData.performSearch(searchterm,(res) => {
      message.remove()
      resultlist = document.createElement('ul')
      resultlist.classList.add('resultlist')
      this.element.appendChild(resultlist)

      // message.textContent = JSON.stringify(res)
      let sortedterms = Object.keys(res);
      sortedterms.sort((a,b)=>(this.fnnamelen(a)-this.fnnamelen(b)))
      if(Object.keys(res).length>20){
        sortedterms = sortedterms.slice(0,21)
        overflowmessage = document.createElement('div');
        overflowmessage.textContent = `${Object.keys(res).length-20} other term(s) matched your search`
        overflowmessage.classList.add('overflowmessage')
        overflowmessage.classList.add('panel-contents')
        this.element.appendChild(overflowmessage)
      }else if(Object.keys(res).length==0){
        overflowmessage = document.createElement('div');
        overflowmessage.textContent = '0 terms matched your search'
        overflowmessage.classList.add('overflowmessage')
        overflowmessage.classList.add('panel-contents')
        this.element.appendChild(overflowmessage)
      }

      sortedterms.forEach((key,i)=>{
        listelement = document.createElement('li')
        listelementlink = document.createElement('a')
        listelementlink.onclick = () => {this.openPage(res[key])};
        listelementlink.textContent = key
        listelement.appendChild(listelementlink)
        resultlist.appendChild(listelement)
      });
    });
  }

  fnnamelen(res){
    if(res.indexOf("()")==-1){
      return res.length
    }else{
      return res.indexOf("()")
    }
  }

  clearElement(){
    toremove = []
    for (let i = 0; i < this.element.childElementCount; i++) {
      if (!this.element.children[i].classList.contains('python-docget-header')){
        toremove.push(this.element.children[i])
      }
    }
    toremove.forEach((item) => { item.remove(); });
  }

  openPage(pageURL){
    this.clearElement()

    message = document.createElement('div')
    message.textContent = `Loading page: ${pageURL}`
    message.classList.add('panel-contents')
    this.element.appendChild(message)

    PythonDocgetData.getPage(pageURL,(res)=>{
      message.innerHTML = res
      console.log(res)
    });
  }

  getTitle() {
    // Used by Atom for tab text
    return 'Python Docs';
  }

  getURI() {
    // Used by Atom to identify the view when toggling.
    return this.URI;
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {
    return {
      // This is used to look up the deserializer function. It can be any string, but it needs to be
      // unique across all packages!
      deserializer: 'python-docget/PythonDocgetView'
    };
  }

  // Tear down any state and detach
  destroy() {
    this.element.remove();
    this.subscriptions.dispose();
  }

  getElement() {
    return this.element;
  }

  getDefaultLocation() {
    // This location will be used if the user hasn't overridden it by dragging the item elsewhere.
    // Valid values are "left", "right", "bottom", and "center" (the default).
    return 'right';
  }

  getAllowedLocations() {
    // The locations into which the item can be moved.
    return ['left', 'right', 'bottom'];
  }
}
