/* globals Uint8Array */

var nacl = require("tweetnacl");
var Util = require("cryptomancy-util");
var Format = require("cryptomancy-format");

var Crypto = module.exports;

/*

We want:

1. message contents to be unavailable to anyone but members of the same session
2. authorship to be attestable to other members of the same sessions
3. authorship and the social graph to be unknown to the server administrator

we accomplish this by:

* encrypting content for a group keypair
  * known to everyone in the group, so everyone there can read it
  * accomplishing #1
* attaching our own public key to each message for the purpose of decryption
  * accomplishing #2
* encrypting the asymmetrically encrypted message with a symmetric key
  * protecting the authorship of the message from the server administrator
  * accomplishing #3

keys = {
    my_asymmetric: {
        publicKey,
        secretKey
    },
    group_asymmetric: {
        publicKey,
        secretKey,
    },
    group_symmetric: {
        
    },
};

encrypt = (plaintext, keys) =>
encode64(
    nonce_2 + // 24 uint8s
    symmetric_encrypt(
        nonce_1 +
        keys.my_asymmetric.publicKey +
        asymmetric_encrypt(
            decodeUint8(plaintext),
            nonce_1, // 24 uint8s
            keys.group_asymmetric.publicKey, // 32 uint8s
            keys.my_asymmetric.secretKey // 32 uint8s
        ),
        nonce_2, // 24 uint8s
        keys.group_symmetric // 32 uint8s
    ) // arbitrary length
)

*/

var Keys = Crypto.keys = {};

Keys.personal = function () {
    return nacl.box.keyPair();
};

// FIXME this is for testing purposes
Keys.group = function () {
    return {
        my_asymmetric: nacl.box.keyPair(),
        group_asymmetric: nacl.box.keyPair(),
        group_symmetric: nacl.randomBytes(nacl.secretbox.keyLength)
    };
};

Keys.clone = function (keys) {
    return {
        my_asymmetric: {
            publicKey: new Uint8Array(keys.my_asymmetric.publicKey),
            secretKey: new Uint8Array(keys.my_asymmetric.secretKey),
        },
        group_asymmetric: {
            publicKey: new Uint8Array(keys.group_asymmetric.publicKey),
            secretKey: new Uint8Array(keys.group_asymmetric.secretKey),
        },
        group_symmetric: new Uint8Array(keys.group_symmetric),
    };
};

var Group = Crypto.group = {};

Group.encrypt = function (plain, keys) {
    // generate random nonces
    var u8_symmetric_nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    var u8_asymmetric_nonce = nacl.randomBytes(nacl.box.nonceLength);

    // convert the string plaintext into a Uint8Array
    var u8_plain = Format.decodeUTF8(plain);

    // encrypt with the asymmetric keys
    var u8_asymmetric_cipher = nacl.box(u8_plain,
        u8_asymmetric_nonce,
        keys.group_asymmetric.publicKey,
        keys.my_asymmetric.secretKey
    );

    // bundle the asymmetric ciphertext with its nonce and your public key
    var u8_bundled_asymmetric = Util.concat([
        u8_asymmetric_nonce,
        keys.my_asymmetric.publicKey,
        u8_asymmetric_cipher,
    ]);

    // encrypt the asymmetric bundle with the symmetric key
    var u8_symmetric_cipher = nacl.secretbox(
        u8_bundled_asymmetric,
        u8_symmetric_nonce,
        keys.group_symmetric
    );

    // bundle the symmetric ciphertext with its nonce
    var u8_bundled_symmetric = Util.concat([
        u8_symmetric_nonce,
        u8_symmetric_cipher
    ]);

    // return the final ciphertext as base64
    return Format.encode64(u8_bundled_symmetric);
};

Group.decrypt = function (cipher, keys) {
    // convert the base64 ciphertext into a Uint8Array
    var u8_bundled_symmetric = Format.decode64(cipher);

    // extract the u8_symmetric_nonce
    var u8_symmetric_nonce = new Uint8Array(Util.slice(
        u8_bundled_symmetric,
        0,
        nacl.secretbox.nonceLength
    ));

    // extract the symmetric ciphertext
    var u8_symmetric_cipher = new Uint8Array(Util.slice(
        u8_bundled_symmetric,
        nacl.secretbox.nonceLength
    ));

    // decrypt the outer symmetric crypto
    var u8_bundled_asymmetric = nacl.secretbox.open(
        u8_symmetric_cipher,
        u8_symmetric_nonce,
        keys.group_symmetric
    );

    // extract the asymmetric nonce
    var u8_asymmetric_nonce = new Uint8Array(Util.slice(
        u8_bundled_asymmetric,
        0,
        nacl.box.nonceLength
    ));

    // extract the sender's public key
    var u8_senders_publicKey = new Uint8Array(Util.slice(
        u8_bundled_asymmetric,
        nacl.box.nonceLength,
        nacl.box.nonceLength + nacl.box.publicKeyLength
    ));

    // extract the asymmetric ciphertext
    var u8_asymmetric_cipher = new Uint8Array(Util.slice(
        u8_bundled_asymmetric,
        nacl.box.nonceLength + nacl.box.publicKeyLength
    ));

    // decrypt the inner asymmetric crypto
    var u8_plain = nacl.box.open(
        u8_asymmetric_cipher,
        u8_asymmetric_nonce,
        u8_senders_publicKey, // keys.group_asymmetric.publicKey,
        keys.group_asymmetric.secretKey
    );

    // return the final ciphertext as UTF8
    return Format.encodeUTF8(u8_plain);
};
