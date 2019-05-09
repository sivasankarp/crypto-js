
CryptoJS.pad.Iso97971 = {
    pad: function (data, blockSize) {
        data.concat(CryptoJS.lib.WordArray.create([0x80000000], 1));

        CryptoJS.pad.ZeroPadding.pad(data, blockSize);
    },

    unpad: function (data) {
        CryptoJS.pad.ZeroPadding.unpad(data);

        data.sigBytes--;
    }
};
