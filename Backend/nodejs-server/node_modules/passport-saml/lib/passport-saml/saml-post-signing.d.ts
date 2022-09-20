import { SAMLOptions } from './types';
export declare function signSamlPost(samlMessage: string, xpath: string, options: SAMLOptions): string;
export declare function signAuthnRequestPost(authnRequest: string, options: SAMLOptions): string;
