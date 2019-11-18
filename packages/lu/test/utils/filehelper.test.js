const utils = require('@microsoft/bf-cli-command').utils
const expect = require('chai').expect;   
const fileHelper = require('./../../src/utils/filehelper')
const luObject = require('./../../src/parser/lu/lu')
const path = require('path')

describe('utils/filehelper test', () => {
    it('File helper correctly  builds a luObject list from a file', async function(){
        try{
            let expected = []
            let pathToFile = path.resolve(path.join(__dirname, './../fixtures/file.lu'))
            let content = await utils.readTextFile(pathToFile)
            expected.push(new luObject(content, pathToFile))
            let luObjArray = await fileHelper.getLuObjects('', pathToFile)
            expect(luObjArray).to.deep.equal(expected)
        }catch(err){
            console.log(err)
        }
    })

    it('File helper correctly  builds a luObject list from stdin', async function(){
        try{
            let content = `> Definition for greeting intent
            # Greeting
            - Hi
            - Hello
            > users might say these
            - Good morning 
            - Good evening`
            let luObjArray = await fileHelper.getLuObjects(content, '')
            let expected = []
            expected.push(new luObject(content, 'stdin'))
            expect(luObjArray).to.deep.equal(expected)
        }catch(err){
            console.log(err)
        }
    })

    it('File helper correctly build a triggerIntent to dialog mapping dict', async function(){
        try{
            let pathToFile = path.resolve(path.join(__dirname, './../fixtures/testcases/interuption/intent_to_lu.config'))
            let configObject = await fileHelper.getConfigObject(pathToFile)
            expect(Array.from(configObject.keys()).length).to.deep.equals(3)
            expect(configObject.get('.\\dia2\\dia2.lu').get('dia4_trigger')).to.deep.equals('.\\dia4\\dia4.lu')
            expect(configObject.get('.\\main\\main.fr-fr.lu').get('dia2_trigger')).to.deep.equals('.\\dia2\\dia2.fr-fr.lu')
        }catch(err){
            console.log(err)
        }
    })
})