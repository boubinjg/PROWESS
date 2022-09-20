import { Strategy as PassportStrategy } from 'passport-strategy';
import * as saml from './saml';
import { AuthenticateOptions, AuthorizeOptions, RequestWithUser, SamlConfig, VerifyWithoutRequest, VerifyWithRequest } from './types';
declare class Strategy extends PassportStrategy {
    name: string;
    _verify: VerifyWithRequest | VerifyWithoutRequest;
    _saml: saml.SAML;
    _passReqToCallback?: boolean;
    _authnRequestBinding?: string;
    constructor(options: SamlConfig, verify: VerifyWithRequest | VerifyWithoutRequest);
    authenticate(req: RequestWithUser, options: AuthenticateOptions & AuthorizeOptions): void;
    logout(req: RequestWithUser, callback: (err: Error | null, url?: string | null) => void): void;
    generateServiceProviderMetadata(decryptionCert: string | null, signingCert?: string | null): string;
}
export = Strategy;
