import {expect, test} from '@oclif/test'
const path = require('path')
const uuidv1 = require('uuid/v1')
const nock = require('nock')

describe('luis:build cli parameters test', () => {
  test
    .stdout()
    .command(['luis:build', '--help'])
    .it('should print the help contents when --help is passed as an argument', ctx => {
      expect(ctx.stdout).to.contain('Build lu files to train and publish luis applications')
    })

  test
    .stdout()
    .stderr()
    .command(['luis:build', '--in', `${path.join(__dirname, './../../fixtures/testcases/lubuild')}`, '--botname', 'Contoso'])
    .it('displays an error if any required input parameters are missing', ctx => {
      expect(ctx.stderr).to.contain(`Missing required flag:\n --authoringkey AUTHORINGKEY`)
    })

  test
    .stdout()
    .stderr()
    .command(['luis:build', '--authoringkey', uuidv1(), '--botname', 'Contoso'])
    .it('displays an error if any required input parameters are missing', ctx => {
      expect(ctx.stderr).to.contain(`Missing required flag:\n -i, --in IN  Lu file or folder`)
    })

  test
    .stdout()
    .stderr()
    .command(['luis:build', '--authoringkey', uuidv1(), '--in', `${path.join(__dirname, './../../fixtures/testcases/lubuild')}`])
    .it('displays an error if any required input parameters are missing', ctx => {
      expect(ctx.stderr).to.contain(`Missing required flag:\n --botname BOTNAME  Bot name`)
    })
})

describe('luis:build update application', () => {
  before(function () {
    nock('https://westus.api.cognitive.microsoft.com')
      .get(uri => uri.includes('apps'))
      .reply(200, [{
        name: 'test(development)-sandwich.en-us.lu',
        id: 'f8c64e2a-8635-3a09-8f78-39d7adc76ec5'
      }])

    nock('https://westus.api.cognitive.microsoft.com')
      .get(uri => uri.includes('apps'))
      .reply(200, {
        name: 'test(development)-sandwich.en-us.lu',
        id: 'f8c64e2a-8635-3a09-8f78-39d7adc76ec5',
        activeVersion: '0.1'
      })

    nock('https://westus.api.cognitive.microsoft.com')
      .get(uri => uri.includes('export'))
      .reply(200, {
        name: 'test(development)-sandwich.en-us.lu',
        versionId: '0.1'
      })

    nock('https://westus.api.cognitive.microsoft.com')
      .post(uri => uri.includes('import'))
      .reply(201, '0.2')

    nock('https://westus.api.cognitive.microsoft.com')
      .post(uri => uri.includes('train'))
      .reply(202, {
        statusId: 2,
        status: 'UpToDate'
      })

    nock('https://westus.api.cognitive.microsoft.com')
      .get(uri => uri.includes('train'))
      .reply(200, [{
        modelId: '99999',
        details: {
          statusId: 0,
          status: 'Success',
          exampleCount: 0
        }
      }])

    nock('https://westus.api.cognitive.microsoft.com')
      .post(uri => uri.includes('publish'))
      .reply(201, {
        versionId: '0.2',
        isStaging: true
      })
  })

  test
    .stdout()
    .command(['luis:build', '--in', './test/fixtures/testcases/lubuild/sandwich/sandwich.en-us.lu', '--authoringkey', uuidv1(), '--botname', 'test'])
    .it('should update a luis application when lu file is updated', ctx => {
      expect(ctx.stdout).to.contain('Start to handle applications')
      expect(ctx.stdout).to.contain('creating version=0.2')
      expect(ctx.stdout).to.contain('training version=0.2')
      expect(ctx.stdout).to.contain('waiting for training for version=0.2')
      expect(ctx.stdout).to.contain('publishing version=0.2')
      expect(ctx.stdout).to.contain('publishing finished')
    })
})