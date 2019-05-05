var Crypto = require("./crypto");
//var Format = require("cryptomancy-format");
//var Source = require("cryptomancy-source");
var Assert = require("assert");

// generate your own asymmetric keypair
var keys = Crypto.keys.group();

var plaintext = "MY_PLAINTEXT";

Assert.equal(
    Crypto.decrypt(
        Crypto.encrypt(
            plaintext,
            keys
        ),
        keys
    ),
    plaintext
);
