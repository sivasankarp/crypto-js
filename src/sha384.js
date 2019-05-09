(function () {
    var C = CryptoJS;
    var C_x64 = C.x64;
    var X64Word = C_x64.Word;
    var X64WordArray = C_x64.WordArray;
    var C_algo = C.algo;
    var SHA512 = C_algo.SHA512;


    var SHA384 = C_algo.SHA384 = SHA512.extend({
        _doReset: function () {
            this._hash = new X64WordArray.init([
                new X64Word.init(0xcbbb9d5d, 0xc1059ed8), new X64Word.init(0x629a292a, 0x367cd507),
                new X64Word.init(0x9159015a, 0x3070dd17), new X64Word.init(0x152fecd8, 0xf70e5939),
                new X64Word.init(0x67332667, 0xffc00b31), new X64Word.init(0x8eb44a87, 0x68581511),
                new X64Word.init(0xdb0c2e0d, 0x64f98fa7), new X64Word.init(0x47b5481d, 0xbefa4fa4)
            ]);
        },

        _doFinalize: function () {
            var hash = SHA512._doFinalize.call(this);

            hash.sigBytes -= 16;

            return hash;
        }
    });


    C.SHA384 = SHA512._createHelper(SHA384);


    C.HmacSHA384 = SHA512._createHmacHelper(SHA384);
}());
