// Copyright 2017 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Flags: --allow-natives-syntax

(function() {
  "use strict";
  function bar() { return this; }

  function foo(x) {
    return bar.bind(x);
  }

  assertEquals(0, foo(0)());
  assertEquals(1, foo(1)());
  %OptimizeFunctionOnNextCall(foo);
  assertEquals("", foo("")());
})();

(function() {
  "use strict";
  function bar(x) { return x; }

  function foo(x) {
    return bar.bind(undefined, x);
  }

  assertEquals(0, foo(0)());
  assertEquals(1, foo(1)());
  %OptimizeFunctionOnNextCall(foo);
  assertEquals("", foo("")());
})();

(function() {
  function bar(x) { return x; }

  function foo(x) {
    return bar.bind(undefined, x);
  }

  assertEquals(0, foo(0)());
  assertEquals(1, foo(1)());
  %OptimizeFunctionOnNextCall(foo);
  assertEquals("", foo("")());
})();

(function() {
  "use strict";
  function bar(x, y) { return x + y; }

  function foo(x, y) {
    return bar.bind(undefined, x, y);
  }

  assertEquals(0, foo(0, 0)());
  assertEquals(2, foo(1, 1)());
  %OptimizeFunctionOnNextCall(foo);
  assertEquals("ab", foo("a", "b")());
  assertEquals(0, foo(0, 1).length);
  assertEquals("bound bar", foo(1, 2).name)
})();

(function() {
  function bar(x, y) { return x + y; }

  function foo(x, y) {
    return bar.bind(undefined, x, y);
  }

  assertEquals(0, foo(0, 0)());
  assertEquals(2, foo(1, 1)());
  %OptimizeFunctionOnNextCall(foo);
  assertEquals("ab", foo("a", "b")());
  assertEquals(0, foo(0, 1).length);
  assertEquals("bound bar", foo(1, 2).name)
})();

(function() {
  function bar(f) { return f(1); }

  function foo(g) { return bar(g.bind(null, 2)); }

  assertEquals(3, foo((x, y) => x + y));
  assertEquals(1, foo((x, y) => x - y));
  %OptimizeFunctionOnNextCall(foo);
  assertEquals(3, foo((x, y) => x + y));
  assertEquals(1, foo((x, y) => x - y));
})();

(function() {
  function add(x, y) { return x + y; }

  function foo(a) { return a.map(add.bind(null, 1)); }

  assertEquals([1, 2, 3], foo([0, 1, 2]));
  assertEquals([2, 3, 4], foo([1, 2, 3]));
  %OptimizeFunctionOnNextCall(foo);
  assertEquals([1, 2, 3], foo([0, 1, 2]));
  assertEquals([2, 3, 4], foo([1, 2, 3]));
})();

(function() {
  const add = (x, y) => x + y;
  const inc = add.bind(null, 1);

  function foo(inc) { return inc(1); }

  assertEquals(2, foo(inc));
  assertEquals(2, foo(inc));
  %OptimizeFunctionOnNextCall(foo);
  assertEquals(2, foo(inc));
})();

(function() {
  const A = class A {};
  const B = A.bind();

  function foo() { return new B; }

  assertInstanceof(foo(), A);
  assertInstanceof(foo(), B);
  %OptimizeFunctionOnNextCall(foo);
  assertInstanceof(foo(), A);
  assertInstanceof(foo(), B);
})();

(function() {
  const A = class A {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  };
  const B = A.bind(null, 1, 2);

  function foo(z) { return new B(z); }

  assertEquals(1, foo(3).x);
  assertEquals(2, foo(3).y);
  assertEquals(3, foo(3).z);
  %OptimizeFunctionOnNextCall(foo);
  assertEquals(1, foo(3).x);
  assertEquals(2, foo(3).y);
  assertEquals(3, foo(3).z);
})();

(function() {
  const A = class A {};

  function foo() {
    const B = A.bind();
    return new B;
  }

  assertInstanceof(foo(), A);
  assertInstanceof(foo(), A);
  %OptimizeFunctionOnNextCall(foo);
  assertInstanceof(foo(), A);
})();

(function() {
  const A = class A {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  };

  function foo(z) {
    const B = A.bind(null, 1, 2);
    return new B(z);
  }

  assertEquals(1, foo(3).x);
  assertEquals(2, foo(3).y);
  assertEquals(3, foo(3).z);
  %OptimizeFunctionOnNextCall(foo);
  assertEquals(1, foo(3).x);
  assertEquals(2, foo(3).y);
  assertEquals(3, foo(3).z);
})();
