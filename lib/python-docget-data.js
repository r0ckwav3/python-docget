'use babel';

const https = require('https');
const docsurl = 'https://docs.python.org/3/genindex-all.html';
const docsurlprefix = 'https://docs.python.org/3/';

export default {

  lookupTable: null,

  getData(callback){
    https.get(docsurl ,(res) => {
      if (res.statusCode != 200){
        console.log(res.statusCode)
        console.log(res.statusMessage)
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });

      res.on('end', () => {
        let resultsloc = rawData.indexOf("<div class=\"body\" role=\"main\">")

        this.lookupTable = {}

        let index = resultsloc
        let flag = true
        let section = ""
        let tempcounter = 0

        while(flag){
          // find next tag
          while(rawData[index]!="<"){ index+=1; }
          let beginindex = index
          while(rawData[index]!=">"){ index+=1; }
          index+=1
          //console.log(rawData.substring(beginindex,index))
          let parsedtag = this.parseTag(rawData.substring(beginindex,index))
          //console.log("parsed!")

          //possibly use it
          if(parsedtag['type'] == 'h2' && 'id' in parsedtag['tags']){
            //console.log(parsedtag['tags']['id'])
            section = parsedtag['tags']['id']
          }else if(parsedtag['type'] == 'li'){
            my_endindex = this.matchTag(rawData,beginindex)
            innertags = this.listTags(this.tagContents(rawData.substring(beginindex,my_endindex)))

            if(innertags.length == 1){
              if(innertags[0][0] == '<'){
                if('href' in this.parseTag(innertags[0])['tags']){
                  this.processLink(innertags[0],0,section,null)
                }
              }
            }else{
              //console.log(innertags)
              subsection = null;
              if(innertags[0][0] == '<'){
                if('href' in this.parseTag(innertags[0])['tags']){
                  subsection = this.processLink(innertags[0],0,section,null)
                  if(subsection.indexOf(" (")!=-1){ // this is suuuper hacky, but I think it works
                    subsection = subsection.substring(0,subsection.indexOf(" ("))
                  }
                }
              }
              if(!subsection){
                subsection = innertags[0]
              }
              //console.log(this.listTags(this.tagContents(innertags[1])))

              this.listTags(this.tagContents(innertags[1])).forEach((litag, i) => {
                ltc = this.tagContents(litag)
                if(ltc.indexOf("<") != -1){
                  if('href' in this.parseTag(ltc.substring(ltc.indexOf("<"),ltc.length))['tags']){
                    this.processLink(ltc,ltc.indexOf("<"),section,subsection)
                  }
                }
              });

            }

            index = my_endindex
          }else if(('class' in parsedtag['tags']) ?
                    parsedtag['tags']['class'] == 'sphinxsidebar' : false){
            flag = false
          }else if(parsedtag['type'] == '/body'){
            flag = false
          }
        }
        //console.log(this.lookupTable)
        callback()

      }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
      });

    });
  },

  performSearch(searchterm,callback){
    if(!this.lookupTable){
      this.getData(()=>{callback(this.searchHelper(searchterm))})
    }else{
      callback(this.searchHelper(searchterm))
    }
  },

  searchHelper(searchterm){
    possible = this.lookupTable
    searchterm.split(/[. ]/).forEach((word,i) => {
      newpossible = {}
      Object.keys(possible).forEach((key, j) => {
        if(key.indexOf(word)!=-1){
          newpossible[key]=possible[key]
        }
      });
      possible = newpossible
    });

    return possible
  },

  getPage(url,callback){
    let urlpostfix = url.substring(0,url.indexOf("#"))
    let dtClass = url.substring(url.indexOf("#")+1,url.length)

    https.get(docsurlprefix+url ,(res) => {
      if (res.statusCode != 200){
        console.log(res.statusCode)
        console.log(res.statusMessage)
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });

      res.on('end', () => {
        let dtindex = rawData.indexOf(`<dt id=\"${dtClass}\">`)
        let ddindex = this.matchTag(rawData,dtindex)
        while(rawData[ddindex]!="<"){ddindex++}

        let endindex = this.matchTag(rawData,ddindex)

        callback(rawData.substring(dtindex,endindex))
      });
    });
  },

  parseTag(tag){ // we assume that tag[0] = "<" and tag[-1] = ">"
    let ans = {'type':null,'tags':{}};

    let nextspace = tag.indexOf(" ");
    if(nextspace == -1){
      ans['type'] = tag.substring(1,tag.length-1);
    }else{
      ans['type'] = tag.substring(1,tag.indexOf(" "));
      let inquotes = false;

      for(let index = nextspace+1; index<tag.length; index++){
        if(tag[index]=="\""){
          inquotes = !inquotes
        }else if((tag[index]==" " || tag[index] == ">") && !inquotes){
          let tagstring = tag.substring(nextspace+1,index)
          let equalindex = tagstring.indexOf("=")
          if(equalindex!=-1){
            let tagkey = tagstring.substring(0,tagstring.indexOf("="))
            let tagval = tagstring.substring(tagstring.indexOf("=")+2,tagstring.length-1)
            ans['tags'][tagkey] = tagval
          }

          nextspace = index
        }
      }
    }
    return ans
  },

  //given the starting index of a tag, find the ending index of the matching tag
  matchTag(s,index){
    const tagtype = this.parseTag(s.substring(index,s.indexOf(">",index)+1))['type']
    let depth = 0
    let flag = true
    while(flag){
      // find next tag
      while(s[index]!="<"){ index+=1; }
      let beginindex = index
      while(s[index]!=">"){ index+=1; }
      index+=1

      let parsedtag = this.parseTag(s.substring(beginindex,index))

      //if it's relevant, add or subtract one from the depth
      if(parsedtag['type'] == tagtype){
        depth++
      }else if(parsedtag['type'] == '/'+tagtype){
        depth--
      }

      if(depth == 0){
        flag = false
      }
    }
    return index
  },

  // this method adds the data to the lookup table automatically, but
  // it also returns the text content of the string
  processLink(rawData,index,section,subsection){
    parsedtag = this.parseTag(rawData.substring(index,rawData.indexOf(">",index)+1))
    endindex = this.matchTag(rawData,index)
    contents = rawData.substring(index,endindex)
    contents = this.tagContents(contents)
    if(subsection){
      //console.log(subsection+ "," +contents)
      if(contents[0]=="("){
        contents = subsection + " " + contents
      }else{
        contents = contents + " -- " + subsection
      }
    }

    if (section!='' && section!='Symbols'){
      this.lookupTable[contents] = parsedtag['tags']['href']
    }
    return contents
  },

  tagContents(s){
    let cbegin = null;
    let cend;
    for(let i = 0; i<s.length; i++){
      if (s[i] == ">" && !cbegin){ cbegin = i+1; }
      if (s[i] == "<"){ cend = i; }
    }
    return s.substring(cbegin,cend)
  },

  listTags(s){
    tagList = []
    index = 0
    oldindex = 0
    while (index < s.length){
      index = s.indexOf("<",index)
      if (index == -1){
        index = s.length
      }

      // .replace(/\s+/g, '') strips whitespace
      intermediatetext = s.substring(oldindex,index).replace(/\s+/g, '')
      if(intermediatetext.length!=0){
        //console.log(intermediatetext)
        tagList.push(intermediatetext)
      }

      if(index != s.length){
        finalindex = this.matchTag(s,index)
        tagList.push(s.substring(index,finalindex))
        index = finalindex
        oldindex = finalindex
      }else{
        index = s.length
      }
    }
    return tagList
  }

};
