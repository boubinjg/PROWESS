"use strict";
const saml = require("./saml");
const inmemory_cache_provider_1 = require("./inmemory-cache-provider");
const SamlStrategy = require("./strategy");
class MultiSamlStrategy extends SamlStrategy {
    constructor(options, verify) {
        if (!options || typeof options.getSamlOptions != 'function') {
            throw new Error('Please provide a getSamlOptions function');
        }
        if (!options.requestIdExpirationPeriodMs) {
            options.requestIdExpirationPeriodMs = 28800000; // 8 hours
        }
        if (!options.cacheProvider) {
            options.cacheProvider = new inmemory_cache_provider_1.CacheProvider({ keyExpirationPeriodMs: options.requestIdExpirationPeriodMs });
        }
        super(options, verify);
        this._options = options;
    }
    authenticate(req, options) {
        this._options.getSamlOptions(req, (err, samlOptions) => {
            if (err) {
                return this.error(err);
            }
            const samlService = new saml.SAML({ ...this._options, ...samlOptions });
            const strategy = Object.assign({}, this, { _saml: samlService });
            Object.setPrototypeOf(strategy, this);
            super.authenticate.call(strategy, req, options);
        });
    }
    logout(req, callback) {
        this._options.getSamlOptions(req, (err, samlOptions) => {
            if (err) {
                return callback(err);
            }
            const samlService = new saml.SAML(Object.assign({}, this._options, samlOptions));
            const strategy = Object.assign({}, this, { _saml: samlService });
            Object.setPrototypeOf(strategy, this);
            super.logout.call(strategy, req, callback);
        });
    }
    /** @ts-expect-error typescript disallows changing method signature in a subclass */
    generateServiceProviderMetadata(req, decryptionCert, signingCert, callback) {
        if (typeof callback !== 'function') {
            throw new Error("Metadata can't be provided synchronously for MultiSamlStrategy.");
        }
        return this._options.getSamlOptions(req, (err, samlOptions) => {
            if (err) {
                return callback(err);
            }
            const samlService = new saml.SAML(Object.assign({}, this._options, samlOptions));
            const strategy = Object.assign({}, this, { _saml: samlService });
            Object.setPrototypeOf(strategy, this);
            return callback(null, super.generateServiceProviderMetadata.call(strategy, decryptionCert, signingCert));
        });
    }
}
module.exports = MultiSamlStrategy;
//# sourceMappingURL=multiSamlStrategy.js.map