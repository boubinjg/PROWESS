import SamlStrategy = require('./strategy');
import type { Request } from 'express';
import { AuthenticateOptions, AuthorizeOptions, MultiSamlConfig, RequestWithUser, VerifyWithoutRequest, VerifyWithRequest } from './types';
declare class MultiSamlStrategy extends SamlStrategy {
    _options: MultiSamlConfig;
    constructor(options: MultiSamlConfig, verify: VerifyWithRequest | VerifyWithoutRequest);
    authenticate(req: RequestWithUser, options: AuthenticateOptions & AuthorizeOptions): void;
    logout(req: RequestWithUser, callback: (err: Error | null, url?: string | null | undefined) => void): void;
    /** @ts-expect-error typescript disallows changing method signature in a subclass */
    generateServiceProviderMetadata(req: Request, decryptionCert: string | null, signingCert: string | null, callback: (err: Error | null, metadata?: string) => void): void;
}
export = MultiSamlStrategy;
