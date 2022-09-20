"use strict";
const passport_strategy_1 = require("passport-strategy");
const saml = require("./saml");
const url = require("url");
class Strategy extends passport_strategy_1.Strategy {
    constructor(options, verify) {
        super();
        if (typeof options == 'function') {
            verify = options;
            options = {};
        }
        if (!verify) {
            throw new Error('SAML authentication strategy requires a verify function');
        }
        // Customizing the name can be useful to support multiple SAML configurations at the same time.
        // Unlike other options, this one gets deleted instead of passed along.
        if (options.name) {
            this.name = options.name;
        }
        else {
            this.name = 'saml';
        }
        this._verify = verify;
        this._saml = new saml.SAML(options);
        this._passReqToCallback = !!options.passReqToCallback;
        this._authnRequestBinding = options.authnRequestBinding || 'HTTP-Redirect';
    }
    authenticate(req, options) {
        options.samlFallback = options.samlFallback || 'login-request';
        const validateCallback = (err, profile, loggedOut) => {
            if (err) {
                return this.error(err);
            }
            if (loggedOut) {
                req.logout();
                if (profile) {
                    req.samlLogoutRequest = profile;
                    return this._saml.getLogoutResponseUrl(req, options, redirectIfSuccess);
                }
                return this.pass();
            }
            const verified = (err, user, info) => {
                if (err) {
                    return this.error(err);
                }
                if (!user) {
                    return this.fail(info, 401);
                }
                this.success(user, info);
            };
            if (this._passReqToCallback) {
                this._verify(req, profile, verified);
            }
            else {
                this._verify(profile, verified);
            }
        };
        const redirectIfSuccess = (err, url) => {
            if (err) {
                this.error(err);
            }
            else {
                this.redirect(url);
            }
        };
        if (req.query && (req.query.SAMLResponse || req.query.SAMLRequest)) {
            const originalQuery = url.parse(req.url).query;
            this._saml.validateRedirect(req.query, originalQuery, validateCallback);
        }
        else if (req.body && req.body.SAMLResponse) {
            this._saml.validatePostResponse(req.body, validateCallback);
        }
        else if (req.body && req.body.SAMLRequest) {
            this._saml.validatePostRequest(req.body, validateCallback);
        }
        else {
            const requestHandler = {
                'login-request': () => {
                    if (this._authnRequestBinding === 'HTTP-POST') {
                        this._saml.getAuthorizeForm(req, (err, data) => {
                            if (err) {
                                this.error(err);
                            }
                            else {
                                const res = req.res;
                                res.send(data);
                            }
                        });
                    }
                    else { // Defaults to HTTP-Redirect
                        this._saml.getAuthorizeUrl(req, options, redirectIfSuccess);
                    }
                },
                'logout-request': () => {
                    this._saml.getLogoutUrl(req, options, redirectIfSuccess);
                }
            }[options.samlFallback];
            if (typeof requestHandler !== 'function') {
                return this.fail(401);
            }
            requestHandler();
        }
    }
    logout(req, callback) {
        this._saml.getLogoutUrl(req, {}, callback);
    }
    generateServiceProviderMetadata(decryptionCert, signingCert) {
        return this._saml.generateServiceProviderMetadata(decryptionCert, signingCert);
    }
}
module.exports = Strategy;
//# sourceMappingURL=strategy.js.map