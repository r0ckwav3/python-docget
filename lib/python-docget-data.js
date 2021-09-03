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
        //let subsection = null
        // TODO: tack on the subsetion in cases like tell()
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
          }else if(parsedtag['type'] == 'a' && 'href' in parsedtag['tags']){
            endindex = this.matchTag(rawData,beginindex)+1
            contents = rawData.substring(beginindex,endindex)
            let cbegin = null;
            let cend;
            for(let i = 0; i<contents.length; i++){
              if (contents[i] == ">" && !cbegin){ cbegin = i+1; }
              if (contents[i] == "<"){ cend = i; }
            }
            contents = contents.substring(cbegin,cend)

            if (section!='' && section!='Symbols'){
              this.lookupTable[contents] = parsedtag['tags']['href']
            }
            index = endindex
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
    possible = {}
    Object.keys(this.lookupTable).forEach((key, i) => {
      if(key.indexOf(searchterm)!=-1){
        possible[key]=this.lookupTable[key]
      }
    });
    return possible
  },

  getPage(url,callback){
    let urlpostfix = url.substring(0,url.indexOf("#"))
    let dtClass = url.substring(url.indexOf("#")+1,url.length)

    https.get(docsurlprefix+url ,(res) => {
      console.log(res)
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
  }

};
