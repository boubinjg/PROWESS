"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAuthnRequestPost = exports.signSamlPost = void 0;
const xml_crypto_1 = require("xml-crypto");
const algorithms = require("./algorithms");
const authnRequestXPath = '/*[local-name(.)="AuthnRequest" and namespace-uri(.)="urn:oasis:names:tc:SAML:2.0:protocol"]';
const issuerXPath = '/*[local-name(.)="Issuer" and namespace-uri(.)="urn:oasis:names:tc:SAML:2.0:assertion"]';
const defaultTransforms = ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/2001/10/xml-exc-c14n#'];
function signSamlPost(samlMessage, xpath, options) {
    if (!samlMessage)
        throw new Error('samlMessage is required');
    if (!xpath)
        throw new Error('xpath is required');
    if (!options) {
        options = {};
    }
    if (options.privateCert) {
        console.warn("options.privateCert has been deprecated; use options.privateKey instead.");
        if (!options.privateKey) {
            options.privateKey = options.privateCert;
        }
    }
    if (!options.privateKey)
        throw new Error('options.privateKey is required');
    const transforms = options.xmlSignatureTransforms || defaultTransforms;
    const sig = new xml_crypto_1.SignedXml();
    if (options.signatureAlgorithm) {
        sig.signatureAlgorithm = algorithms.getSigningAlgorithm(options.signatureAlgorithm);
    }
    sig.addReference(xpath, transforms, algorithms.getDigestAlgorithm(options.digestAlgorithm));
    sig.signingKey = options.privateKey;
    sig.computeSignature(samlMessage, { location: { reference: xpath + issuerXPath, action: 'after' } });
    return sig.getSignedXml();
}
exports.signSamlPost = signSamlPost;
function signAuthnRequestPost(authnRequest, options) {
    return signSamlPost(authnRequest, authnRequestXPath, options);
}
exports.signAuthnRequestPost = signAuthnRequestPost;
//# sourceMappingURL=saml-post-signing.js.map