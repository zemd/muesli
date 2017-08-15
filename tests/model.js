'use strict';

import test from 'ava';
import BaseModel from '../src/model';
import _ from 'lodash';
import ConstraintError from '../errors/ConstraintError';
import { equalPasswords } from './utils/validators';

const required = (groups = []) => {
  return (propValue, propName, currentGroup) => {
    if (currentGroup && groups.length > 0 && groups.includes(currentGroup)) {
      return;
    }
    if (propValue == null) {
      throw new ConstraintError(propName, propValue, `${propName} is required property`);
    }
  };
};

test('Default options', t => {
  t.plan(7);

  let inst = new BaseModel();

  t.false(inst.propsSettings.strict);
  t.false(inst.propsSettings.throwOnStrictError);
  t.true(inst.propsSettings.useGetters);
  t.true(inst.propsSettings.useSetters);
  t.true(Array.isArray(inst.propsSettings.validators));
  t.is(inst.propsSettings.validators.length, 0);
  t.is(inst.propsSettings.nameStrategy, '');
});

test('setOption/getOption', t => {
  t.plan(2);
  let inst = new BaseModel();

  t.false(inst.propsSettings.strict);
  inst.propsSettings.strict = true;
  t.true(inst.propsSettings.strict);
});

test('Setting values for properties defined in schema', t => {
  t.plan(4);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: 'string',
    },
    lastName: {
      filter: 'string',
    },
  };

  const inst = new TestModel();

  t.is(inst.get('firstName'), undefined);
  t.is(inst.get('lastName'), undefined);

  inst.set('firstName', 'Dmytro');
  inst.set('lastName', 'Zelenetskyi');

  t.is(inst.get('firstName'), 'Dmytro');
  t.is(inst.get('lastName'), 'Zelenetskyi');
});

test('Setting values for custom attributes which were not defined in schema. strict mode disabled', t => {
  t.plan(6);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: 'string',
    },
    lastName: {
      filter: String,
    },
  };

  let inst = new TestModel();

  t.is(inst.get('firstName'), undefined);
  t.is(inst.get('lastName'), undefined);

  inst.set('lastName', 'Zelenetskyi');
  inst.set('fullName', 'Dmytro Zelenetskyi');

  t.is(inst.get('firstName'), undefined);
  t.is(inst.get('lastName'), 'Zelenetskyi');
  t.is(inst.get('fullName'), 'Dmytro Zelenetskyi');
  t.is(inst.get('randomProp'), undefined, `Unknown property must be undefined`);
});

test('Setting values for custom attributes which were not defined in schema. strict mode enabled and throwOnStrictError disabled', t => {
  t.plan(2);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: 'string',
    },
  };
  TestModel.propsSettings = {
    strict: true,
  };

  const inst = new TestModel();

  inst.set('firstName', 'Dmytro');
  inst.set('lastName', 'Zelenetskyi');

  t.is(inst.get('firstName'), 'Dmytro');
  t.is(inst.get('lastName', undefined));
});

test('Setting values for custom attributes which were not defined in schema. strict mode enabled and throwOnStrictError enabled', t => {
  t.plan(3);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: 'string',
    },
  };
  TestModel.propsSettings = {
    strict: true,
    throwOnStrictError: true,
  };

  let inst = new TestModel();

  inst.set('firstName', 'Dmytro');

  t.throws(() => {
    inst.set('lastName', 'Zelenetskyi');
  });
  t.is(inst.get('firstName'), 'Dmytro');
  t.is(inst.get('lastName'), undefined);
});

test('Model must return values with correct types due to their filters', t => {
  t.plan(3);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: 'string',
      value: 123,
    },
    lastName: {
      filter: String,
      value: true,
    },
  };

  let inst = new TestModel();

  t.is(typeof inst.get('firstName'), 'string');
  t.is(typeof inst.get('lastName'), 'string');

  inst.set('firstName', {});
  t.is(inst.get('firstName'), '[object Object]');
});

test.cb('Validate 1 constraint with default group and fail with ConstraintError', t => {
  t.plan(5);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: 'string',
      constraints: [required()],
    },
  };
  let inst = new TestModel();

  inst.validatePropsConstraints()
    .subscribe((results) => {
      let err = _.head(results);

      t.is(results.length, 1);
      t.true('propName' in err);
      t.is(err.statusCode, 422);
      t.is(err.propValue, undefined);
      t.is(err.propName, 'firstName');
      // t.is(err.group, BaseModel.DEFAULT_GROUP);

      t.end();
    }, (err) => {
      t.fail(err.message);
    });
});

test.cb('Validate 1 constraint with default group and succeed', t => {
  t.plan(1);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: 'string',
      value: 'Dmytro',
      constraints: [required()],
    },
  };

  let inst = new TestModel();

  inst.validatePropsConstraints()
    .subscribe((results) => {
      t.is(results.length, 0);
      t.end();
    }, (err) => {
      t.fail(err.message);
    });
});

test.cb('Validate 1 constraint with custom group and succeed', t => {
  t.plan(1);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: 'string',
      value: 'Dmytro',
      constraints: [required(['group1'])],
    },
  };
  let inst = new TestModel();

  inst.validatePropsConstraints('custom')
    .subscribe((results) => {
      t.is(results.length, 0);
      t.end();
    }, (err) => {
      t.fail(err.message);
    });
});

test.cb('Validate only that constraint that was defined in argument', t => {
  t.plan(6);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: 'string',
      constraints: [required(['group1']), required(['group2'])],
    },
  };
  let inst = new TestModel();

  inst.validatePropsConstraints('group2')
    .subscribe((results) => {
      let err = _.head(results);

      t.is(results.length, 1);
      t.true('propName' in err);
      t.is(err.statusCode, 422);
      t.is(err.propValue, undefined);
      t.is(err.propName, 'firstName');
      t.is(err.group, 'group2');

      t.end();
    }, (err) => {
      t.fail(err.message);
    });
});

test.cb('Validate 1 model validator with default group and fail with ValidatorError', t => {
  t.plan(6);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: String,
      value: 'Dmytro',
    },
    lastName: {
      filter: String,
      value: 'Zelenetskyi',
    },
  };
  TestModel.propsSettings = {
    validators: [
      equalPasswords(),
    ],
  };

  let inst = new TestModel();

  inst.validateModelValidators()
    .subscribe((results) => {
      let err = _.head(results);

      t.true(Array.isArray(results));
      t.is(results.length, 1);

      t.true('props' in err);
      t.is(err.statusCode, 422);
      t.is(err.propValue, undefined);
      t.is(err.propName, undefined);
      // t.is(err.group, BaseModel.DEFAULT_GROUP);

      t.end();
    }, (err) => {
      t.fail(err.message);
    });
});

test('toJSON changing nameStrategy dynamically and using different groups', t => {
  t.plan(4);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      value: 'Dmytro',

      json: {
        groups: ['group1'],
      },
    },
    lastName: {
      value: 'Zelenetskyi',

      json: {
        hidden: true,
      },
    },
    age: {
      filter: 'integer',
      value: 10,

      json: {
        groups: ['group2'],
      },
    },
  };
  let inst = new TestModel();

  t.deepEqual(inst.toJSON(), { firstName: 'Dmytro', age: 10 });
  inst.propsSettings.nameStrategy = 'snake';
  t.deepEqual(inst.toJSON(), { first_name: 'Dmytro', age: 10 });

  inst.propsSettings.nameStrategy = 'camel';
  t.deepEqual(inst.toJSON({ group: 'group1' }), { firstName: 'Dmytro' });
  t.deepEqual(inst.toJSON({ group: 'group2' }), { age: 10 });
});

test('fromJSON creates valid Model object in non strict mode', t => {
  t.plan(3);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: String,
      constraints: [required()],
    },
    lastName: {
      filter: String,
    },
  };

  const inst = TestModel.fromJSON({
    firstName: 'Dmytro',
    lastName: 'Zelenetskyi',
    age: 30,
  });

  t.is(inst.get('firstName'), 'Dmytro');
  t.is(inst.get('lastName'), 'Zelenetskyi');
  t.is(inst.get('age'), 30);
});

test('fromJSON creates valid Model object with skipping invalid props in strict mode', t => {
  t.plan(3);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: String,
      constraints: [required()],
    },
    lastName: {
      filter: String,
    },
  };
  TestModel.propsSettings = {
    strict: true,
  };

  const inst = TestModel.fromJSON({
    firstName: 'Dmytro',
    lastName: 'Zelenetskyi',
    age: 30,
  });

  t.is(inst.get('firstName'), 'Dmytro');
  t.is(inst.get('lastName'), 'Zelenetskyi');
  t.is(inst.get('age'), undefined);
});

test('fromJSON throws an error when Model configured with strict mode and throwOnStrictError enabled', t => {
  t.plan(1);

  class TestModel extends BaseModel {
  }

  TestModel.props = {
    firstName: {
      filter: String,
      constraints: [required()],
    },
    lastName: {
      filter: String,
    },
  };
  TestModel.propsSettings = {
    strict: true,
    throwOnStrictError: true,
  };

  t.throws(function () {
    TestModel.fromJSON({
      firstName: 'Dmytro',
      lastName: 'Zelenetskyi',
      age: 30,
    });
  });
});

test('Computed properties', t => {
  t.plan(6);

  class TestModel extends BaseModel {}
  TestModel.props = {
    firstName: {
      filter: String,
      value: 'Dmytro',
    },
    lastName: {
      filter: String,
    },
    fullName: {
      filter: function (deps = []) {
        return deps.join(' ');
      },
      computed: ['firstName', 'lastName'],
    },
  };

  const inst = new TestModel();

  t.is(inst.get('firstName'), 'Dmytro');
  t.is(inst.get('lastName'), undefined);
  t.is(inst.get('fullName'), 'Dmytro ');

  inst.set('lastName', 'Zelenetskyi');

  t.is(inst.get('fullName'), 'Dmytro Zelenetskyi');

  inst.set('lastName', 'Zelenetskyi2');
  t.is(inst.get('fullName'), 'Dmytro Zelenetskyi2');

  t.throws(function () {
    inst.set('fullName', 'Bill Gates');
  });
});

// test('Immutable model', t => {
//   t.plan(9);
//
//   class Author extends BaseModel {
//     constructor() {
//       super({
//         firstName: {
//           filter: String,
//           value: 'Default Name'
//         },
//         lastName: {
//           filter: String
//         }
//       }, {
//         immutable: true
//       });
//     }
//   }
//
//   const inst = Author.fromJSON({ firstName: 'Dmytro' });
//   const newInst = inst.set('lastName', 'Zelenetskyi');
//
//   t.true(inst.getOption('immutable'));
//   t.true(newInst.getOption('immutable'));
//
//   t.is(inst.get('firstName'), 'Dmytro');
//   t.is(inst.get('lastName'), '');
//
//   t.false(newInst === inst);
//   t.true(inst instanceof Author);
//   t.true(newInst instanceof Author);
//
//   t.is(newInst.get('firstName'), 'Dmytro');
//   t.is(newInst.get('lastName'), 'Zelenetskyi');
// });

test('useGetters and useSetters', t => {
  t.plan(4);

  class TestModel extends BaseModel {}
  TestModel.props = {
    firstName: {
      filter: String,
      value: 'Default Name',
    },
    lastName: {
      filter: String,
    },
    fullName: {
      filter: function (deps = []) {
        return deps.join(' ');
      },
      computed: ['firstName', 'lastName'],
    },
  };

  const inst = TestModel.fromJSON({ firstName: 'Dmytro' });
  t.is(inst.values.firstName, 'Dmytro');

  inst.values.lastName = 'Zelenetskyi';
  t.is(inst.values.lastName, 'Zelenetskyi');

  t.is(inst.values.fullName, 'Dmytro Zelenetskyi');
  t.throws(() => {
    inst.values.fullName = 'Custom Name';
  });
});

test('version', t => {
  t.plan(2);

  class TestModel extends BaseModel {}
  TestModel.props = {
    firstName: {
      filter: String,
      value: 'Default Name',
    },
    lastName: {
      filter: String,
    },
  };

  const inst = TestModel.fromJSON({ firstName: 'Dmytro' });
  let version = inst.version;
  t.true(inst.version > 0);

  inst.set('lastName', 'Zelenetskyi');
  t.is(inst.version, ++version);
});

test('toJSON with nested models', t => {
  class FirstName extends BaseModel {
  }
  FirstName.props = {
    firstName: {
      filter: String,
      value: 'Dmytro',
    },
  };

  class Author extends BaseModel {
  }
  Author.props = {
    firstName: {
      filter: (v) => FirstName.fromJSON(v),
    },
    lastName: {
      filter: String,
      value: 'Zelenetskyi',
    },
  };

  const inst = new Author();
  const json = inst.toJSON();

  t.deepEqual(json, { lastName: 'Zelenetskyi', firstName: { firstName: 'Dmytro' } });
});
