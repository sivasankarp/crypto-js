function extendWithCMAC(C) {
    function createExt(C) {
        
        var ext;
        if (!C.hasOwnProperty("ext")) {
            ext = C.ext = {};
        } else {
            ext = C.ext;
        }

        var Base = C.lib.Base;
        var WordArray = C.lib.WordArray;

        ext.const_Zero = new WordArray.init([0x00000000, 0x00000000, 0x00000000, 0x00000000]);
        ext.const_One = new WordArray.init([0x00000000, 0x00000000, 0x00000000, 0x00000001]);
        ext.const_Rb = new WordArray.init([0x00000000, 0x00000000, 0x00000000, 0x00000087]); 
        ext.const_Rb_Shifted = new WordArray.init([0x80000000, 0x00000000, 0x00000000, 0x00000043]);
        ext.const_nonMSB = new WordArray.init([0xFFFFFFFF, 0xFFFFFFFF, 0x7FFFFFFF, 0x7FFFFFFF]); 

        ext.isWordArray = function(obj) {
            return obj && typeof obj.clamp === "function" && typeof obj.concat === "function" && typeof obj.words === "array";
        }

     
        C.pad.OneZeroPadding = {
            pad: function (data, blocksize) {
                var blockSizeBytes = blocksize * 4;

                var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

                var paddingWords = [];
                for (var i = 0; i < nPaddingBytes; i += 4) {
                    var paddingWord = 0x00000000;
                    if (i === 0) {
                        paddingWord = 0x80000000;
                    }
                    paddingWords.push(paddingWord);
                }
                var padding = new WordArray.init(paddingWords, nPaddingBytes);

                data.concat(padding);
            },
            unpad: function () {
            }
        };

        C.pad.NoPadding = {
            pad: function () {},
            unpad: function () {}
        };

        ext.leftmostBytes = function(wordArray, n){
            var lmArray = wordArray.clone();
            lmArray.sigBytes = n;
            lmArray.clamp();
            return lmArray;
        };

     
        ext.rightmostBytes = function(wordArray, n){
            wordArray.clamp();
            var wordSize = 32;
            var rmArray = wordArray.clone();
            var bitsToShift = (rmArray.sigBytes - n) * 8;
            if (bitsToShift >= wordSize) {
                var popCount = Math.floor(bitsToShift/wordSize);
                bitsToShift -= popCount * wordSize;
                rmArray.words.splice(0, popCount);
                rmArray.sigBytes -= popCount * wordSize / 8;
            }
            if (bitsToShift > 0) {
                ext.bitshift(rmArray, bitsToShift);
                rmArray.sigBytes -= bitsToShift / 8;
            }
            return rmArray;
        };

      
        ext.popWords = function(wordArray, n){
            var left = wordArray.words.splice(0, n);
            wordArray.sigBytes -= n * 4;
            return new WordArray.init(left);
        };

     
        ext.shiftBytes = function(wordArray, n){
            n = n || 16;
            var r = n % 4;
            n -= r;

            var shiftedArray = new WordArray.init();
            for(var i = 0; i < n; i += 4) {
                shiftedArray.words.push(wordArray.words.shift());
                wordArray.sigBytes -= 4;
                shiftedArray.sigBytes += 4;
            }
            if (r > 0) {
                shiftedArray.words.push(wordArray.words[0]);
                shiftedArray.sigBytes += r;

                ext.bitshift(wordArray, r * 8);
                wordArray.sigBytes -= r;
            }
            return shiftedArray;
        };

    
        ext.xorendBytes = function(arr1, arr2){
            return ext.leftmostBytes(arr1, arr1.sigBytes-arr2.sigBytes)
                    .concat(ext.xor(ext.rightmostBytes(arr1, arr2.sigBytes), arr2));
        };

 
        ext.dbl = function(wordArray){
            var carry = ext.msb(wordArray);
            ext.bitshift(wordArray, 1);
            ext.xor(wordArray, carry === 1 ? ext.const_Rb : ext.const_Zero);
            return wordArray;
        };

        ext.inv = function(wordArray){
            var carry = wordArray.words[4] & 1;
            ext.bitshift(wordArray, -1);
            ext.xor(wordArray, carry === 1 ? ext.const_Rb_Shifted : ext.const_Zero);
            return wordArray;
        };

        ext.equals = function(arr1, arr2){
            if (!arr2 || !arr2.words || arr1.sigBytes !== arr2.sigBytes) {
                return false;
            }
            arr1.clamp();
            arr2.clamp();
            var equal = 0;
            for(var i = 0; i < arr1.words.length; i++) {
                equal |= arr1.words[i] ^ arr2.words[i];
            }
            return equal === 0;
        };

        ext.msb = function(arr) {
            return arr.words[0] >>> 31;
        }
    }

    function createExtBit(C) {

        var ext;
        if (!C.hasOwnProperty("ext")) {
            ext = C.ext = {};
        } else {
            ext = C.ext;
        }

   
        ext.bitshift = function(wordArray, n){
            var carry = 0,
                words = wordArray.words,
                wres,
                skipped = 0,
                carryMask;
            if (n > 0) {
                while(n > 31) {
                    words.splice(0, 1);

                    words.push(0);

                    n -= 32;
                    skipped++;
                }
                if (n == 0) {
                    
                    return carry;
                }
                for(var i = words.length - skipped - 1; i >= 0; i--) {
                    wres = words[i];
                    words[i] <<= n;
                    words[i] |= carry;
                    carry = wres >>> (32 - n);
                }
            } else if (n < 0) {
                while(n < -31) {
                  
                    words.splice(0, 0, 0);

                   
                    words.length--;

                    n += 32;
                    skipped++;
                }
                if (n == 0) {
                  
                    return carry;
                }
                n = -n;
                carryMask = (1 << n) - 1;
                for(var i = skipped; i < words.length; i++) {
                    wres = words[i] & carryMask;
                    words[i] >>>= n;
                    words[i] |= carry;
                    carry = wres << (32 - n);
                }
            }
            return carry;
        };

     
        ext.neg = function(wordArray){
            var words = wordArray.words;
            for(var i = 0; i < words.length; i++) {
                words[i] = ~words[i];
            }
            return wordArray;
        };

        ext.xor = function(wordArray1, wordArray2){
            for(var i = 0; i < wordArray1.words.length; i++) {
                wordArray1.words[i] ^= wordArray2.words[i];
            }
            return wordArray1;
        };

        ext.bitand = function(arr1, arr2){
            var newArr = arr1.clone(),
                tw = newArr.words,
                ow = arr2.words;
            for(var i = 0; i < tw.length; i++) {
                tw[i] &= ow[i];
            }
            return newArr;
        };
    }

    function createCMAC(C) {
     
        var Base = C.lib.Base;
        var WordArray = C.lib.WordArray;
        var AES = C.algo.AES;
        var ext = C.ext;
        var OneZeroPadding = C.pad.OneZeroPadding;

        var CMAC = C.algo.CMAC = Base.extend({
          
            init: function(key){
                this._aes = AES.createEncryptor(key, { iv: new WordArray.init(), padding: C.pad.NoPadding });

                var L = this._aes.finalize(ext.const_Zero);

                var K1 = L.clone();
                ext.dbl(K1);

                if (!this._isTwo) {
                    var K2 = K1.clone();
                    ext.dbl(K2);
                } else {
                    var K2 = L.clone();
                    ext.inv(K2);
                }

                this._K1 = K1;
                this._K2 = K2;

                this._const_Bsize = 16;

                this.reset();
            },

            reset: function () {
                this._x = ext.const_Zero.clone();
                this._counter = 0;
                this._buffer = new WordArray.init();
            },

            update: function (messageUpdate) {
                if (!messageUpdate) {
                    return this;
                }

                var buffer = this._buffer;
                var bsize = this._const_Bsize;

                if (typeof messageUpdate === "string") {
                    messageUpdate = C.enc.Utf8.parse(messageUpdate);
                }

                buffer.concat(messageUpdate);

                while(buffer.sigBytes > bsize){
                    var M_i = ext.shiftBytes(buffer, bsize);
                    ext.xor(this._x, M_i);
                    this._x.clamp();
                    this._aes.reset();
                    this._x = this._aes.finalize(this._x);
                    this._counter++;
                }

                return this;
            },

            finalize: function (messageUpdate) {
                this.update(messageUpdate);

                var buffer = this._buffer;
                var bsize = this._const_Bsize;

                var M_last = buffer.clone();
                if (buffer.sigBytes === bsize) {
                    ext.xor(M_last, this._K1);
                } else {
                    OneZeroPadding.pad(M_last, bsize/4);
                    ext.xor(M_last, this._K2);
                }

                ext.xor(M_last, this._x);

                this.reset(); 

                this._aes.reset();
                return this._aes.finalize(M_last);
            },

            _isTwo: false
        });

     
        C.CMAC = function(key, message){
            return CMAC.create(key).finalize(message);
        };

        C.algo.OMAC1 = CMAC;
        C.algo.OMAC2 = CMAC.extend({
            _isTwo: true
        });
    }

    createExt(C);
    createExtBit(C);
    createCMAC(C);
}

YUI.add('cipher-core-test', function (Y) {
    var C = CryptoJS;

    extendWithCMAC(C);

    Y.Test.Runner.add(new Y.Test.Case({
        name: 'Cipher',

        testCMAC: function () {
            Y.Assert.areEqual('35e1872b95ce5d99bb5dbbbbd79b9b9b', C.CMAC('69c4e0d86a7b0430d8cdb78070b4c55a', 'Test message').toString());
        }
    }));
}, '$Rev$');
