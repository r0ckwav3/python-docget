'use babel';

import PythonDocgetData from './python-docget-data';

export default class PythonDocgetView {

  static URI = 'atom://python-docget-panel';

  constructor(serializedState) {

    // Create root element
    this.element = document.createElement('div')
    this.element.classList.add('python-docget')

    // Create header element
    message = document.createElement('h1')
    message.textContent = 'Python Docs'
    message.classList.add('header')
    this.element.appendChild(message)

    searchbar = document.createElement('input')
    searchbar.setAttribute("type","text")
    searchbar.setAttribute("placeholder","search python docs")
    searchbar.classList.add('header')
    searchbar.classList.add('searchbar')
    this.element.appendChild(searchbar)

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
    message.classList.add('message')
    this.element.appendChild(message)

    PythonDocgetData.performSearch(searchterm,(res) => {
      message.remove()
      resultlist = document.createElement('ul')
      resultlist.classList.add('resultlist')
      this.element.appendChild(resultlist)

      // message.textContent = JSON.stringify(res)
      let sortedterms = Object.keys(res);
      sortedterms.sort((a,b)=>(this.fnnamelen(a)-this.fnnamelen(b)))
      console.log(Object.keys(res).length)
      if(Object.keys(res).length>20){
        sortedterms = sortedterms.slice(0,21)
        overflowmessage = document.createElement('div');
        overflowmessage.textContent = `${Object.keys(res).length-20} other term(s) matched your search`
        resultlist.classList.add('overflowmessage')
        this.element.appendChild(overflowmessage)
      }

      sortedterms.forEach((key,i)=>{
        listelement = document.createElement('li')
        listelement.textContent = key
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
      toremove.push(this.element.children[i])
    }
    toremove.forEach((item) => { item.remove(); });
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
