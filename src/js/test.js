var Crypto = require("./lib/crypto");
//var Format = require("cryptomancy-format");
//var Source = require("cryptomancy-source");
var Assert = require("assert");

// generate your own asymmetric keypair
var keys1 = Crypto.keys.group();
var keys2 = Crypto.keys.clone(keys1);

keys2.my_asymmetric = Crypto.keys.personal();

var plaintext = "MY_PLAINTEXT";

Assert.equal(
    Crypto.group.decrypt(
        Crypto.group.encrypt(
            plaintext,
            keys1
        ),
        keys2
    ),
    plaintext
);
