'use strict';

const AsciiToHtml = require('ansi-to-html'),
  sinon = require('sinon'),
  bluebird = require('bluebird'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  processes = require('../../services/processes'),
  environment = require('../../services/env'),
  fs = require('fs'),
  path = require('path'),
  example1 = fs.readFileSync(path.resolve('./test/mocks/jupyter_examples/example_1.py'), {encoding: 'UTF8'}),
  example2 = fs.readFileSync(path.resolve('./test/mocks/jupyter_examples/example_2.py'), {encoding: 'UTF8'}),
  example3 = fs.readFileSync(path.resolve('./test/mocks/jupyter_examples/example_3.py'), {encoding: 'UTF8'}),
  example4 = fs.readFileSync(path.resolve('./test/mocks/jupyter_examples/example_4.py'), {encoding: 'UTF8'}),
  example5 = fs.readFileSync(path.resolve('./test/mocks/jupyter_examples/example_5.py'), {encoding: 'UTF8'});

describe(dirname + '/' + filename, function () {
  this.timeout(10000);
  let sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    sandbox.stub(environment);
    environment.getEnv.returns(bluebird.resolve(process.env));
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('create', function () {
    const fn = lib[this.title];

    it('creates', function () {
      return fn().then(function (client) {
        return new bluebird(function (resolve, reject) {
          client.on('ready', function () {
            try {
              expect(processes.getChildren().length).to.equal(1);
              resolve(client.kill());
            } catch (ex) {
              reject(ex);
            }
          });
        });
      }).then(function () {
        expect(processes.getChildren().length).to.equal(0);
      });
    });
  });

  describe('checkPython', function () {
    const fn = lib[this.title];

    it('checks', function () {
      return fn({}).then(function (result) {
        expect(result).to.have.property('hasJupyterKernel').that.is.a('boolean');
        expect(result).to.have.property('cwd').that.is.a('string');
        expect(result).to.have.property('version').that.is.a('string');
        expect(result).to.have.property('executable').that.is.a('string');
        expect(result).to.have.property('argv').that.is.an('array');
        expect(result).to.have.property('packages').that.is.an('array');
      });
    });
  });

  describe('JupyterClient', function () {
    let client;

    before(function () {
      return new Promise(function (resolve) {
        return lib.create().then(function (result) {

          client = result;
          client.on('ready', function () {
            resolve();
          });
        });
      });
    });

    after(function () {
      return client.kill();
    });

    describe('getEval', function () {
      const title = this.title;
      let fn;

      before(function () {
        fn = client[title].bind(client);
      });

      it('evals', function () {
        return fn('[]').then(function (result) {
          expect(result).to.deep.equal([]);
        });
      });
    });

    describe('getStatus', function () {
      const title = this.title;
      let fn;

      before(function () {
        fn = client[title].bind(client);
      });

      it('gets current working directory when empty', function () {
        return fn([]).then(function (result) {
          expect(!!result.cwd).to.equal(true);
        });
      });

      it('gets variables when empty', function () {
        return fn([]).then(function (result) {
          expect(result.variables).to.deep.equal({function: [], Series: [], list: [], DataFrame: [], other: [], dict: [], ndarray: []});
          expect(result.variables).to.deep.equal({function: [], Series: [], list: [], DataFrame: [], other: [], dict: [], ndarray: []});
        });
      });
    });

    describe('getAutoComplete', function () {
      const title = this.title;
      let fn;

      before(function () {
        fn = client[title].bind(client);
      });

      it('recognizes "print"', function () {
        const code = 'print "Hello"',
          cursorPos = 4;

        return fn(code, cursorPos).then(function (result) {
          expect(result).to.deep.equal({
            matches: [ 'print' ],
            status: 'ok',
            cursor_start: 0,
            cursor_end: 4,
            metadata: {}
          });
        });
      });
    });

    describe('getInspection', function () {
      const title = this.title;
      let fn;

      before(function () {
        fn = client[title].bind(client);
      });

      it('inspects', function () {
        const convert = new AsciiToHtml(),
          code = 'obj_or_dict = {"akey": "value", "another": "value2"}',
          cursorPos = 0;

        return client.execute(code).then(function () {
          return fn(code, cursorPos);
        }).then(function (result) {
          const text = convert.toHtml(result.data['text/plain']);

          expect(result).to.have.property('status', 'ok');
          expect(result).to.have.property('found', true);
          expect(text).to.match(/Type:/);
          expect(text).to.match(/String form:/);
          expect(text).to.match(/Length:/);
          expect(text).to.match(/Docstring:/);
        });
      });
    });

    describe('isComplete', function () {
      const title = this.title;
      let fn;

      before(function () {
        fn = client[title].bind(client);
      });

      it('print "Hello" is complete with no extra information', function () {
        const code = 'print "Hello"';

        return fn(code).then(function (result) {
          expect(result).to.deep.equal({ status: 'complete' });
        });
      });

      it('print "Hello is invalid with no extra information', function () {
        const code = 'print "Hello';

        return fn(code).then(function (result) {
          expect(result).to.deep.equal({ status: 'invalid' });
        });
      });

      it('x = range(10 is incomplete with empty indent', function () {
        const code = 'x = range(10';

        return fn(code).then(function (result) {
          expect(result).to.deep.equal({ status: 'incomplete', indent: '' });
        });
      });
    });

    describe('execute', function () {
      const title = this.title;
      let fn;

      before(function () {
        fn = client[title];
      });

      it('example 1', function () {
        const expectedResult = {status: 'ok', user_expressions: {}, payload: []};

        return fn.call(client, example1).then(function (result) {
          expect(result).to.deep.equal(expectedResult);
        });
      });

      it('example 2', function () {
        const expectedResult = {status: 'ok', user_expressions: {}, payload: []};

        return fn.call(client, example2).then(function (result) {
          expect(result).to.deep.equal(expectedResult);
        });
      });

      it('example 3', function () {
        const expectedResult = {status: 'ok', user_expressions: {}, payload: []};

        return fn.call(client, example3).then(function (result) {
          expect(result).to.deep.equal(expectedResult);
        });
      });

      it('example 4', function () {
        const expectedResult = {status: 'ok', user_expressions: {}, payload: []};

        client.on('input_request', function () {
          client.input('stuff!');
        });

        return fn.call(client, example4).then(function (result) {
          expect(result).to.deep.equal(expectedResult);
        });
      });

      it('example 5 returns NameError', function () {
        return fn.call(client, example5).then(function (result) {
          sinon.assert.match(result, {
            status: 'error', user_expressions: {},
            ename: 'NameError', evalue: 'name \'asdf\' is not defined'
          });
        });
      });
    });
  });
});
