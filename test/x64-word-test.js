YUI.add('x64-word-test', function (Y) {
    var C = CryptoJS;

    Y.Test.Runner.add(new Y.Test.Case({
        name: 'X64Word',

        testInit: function () {
            var word = C.x64.Word.create(0x00010203, 0x04050607);

            Y.Assert.areEqual(0x00010203, word.high, 'word.high');
            Y.Assert.areEqual(0x04050607, word.low, 'word.low');
        }
    }));
}, '$Rev$');
