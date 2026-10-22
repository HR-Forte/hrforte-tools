import { joinUrl } from '../utils/joinUrl';
import { ApiVersion, VersionConfig, VersioningStrategy } from './types';

export class VersionManager {
  private endpointVersions: Map<string, VersionConfig> = new Map();

  setEndpointVersion(endpointName: string, config: VersionConfig): void {
    this.endpointVersions.set(endpointName, config);
  }

  getEndpointVersion(endpointName: string): VersionConfig | undefined {
    return this.endpointVersions.get(endpointName);
  }

  /**
   * Build versioned URL based on endpoint's versioning strategy
   *
   * @param baseUrl - The base URL of the endpoint
   * @param path - The API path
   * @param endpointName - Name of the endpoint
   * @param requestVersion - Optional version override for this request
   * @returns Versioned URL string
   */
  buildVersionedUrl(baseUrl: string, path: string, endpointName: string, requestVersion?: ApiVersion | null): string {
    const versionConfig = this.endpointVersions.get(endpointName);
    if (!versionConfig) return joinUrl(baseUrl, path);

    const version = requestVersion || versionConfig.defaultVersion;
    if (!version) return joinUrl(baseUrl, path);

    switch (versionConfig.strategy) {
      case 'url-prefix':
        return joinUrl(baseUrl, version, path);
      case 'url-suffix':
        const pathParts = path.split('/');
        pathParts.splice(1, 0, version);
        return joinUrl(baseUrl, ...pathParts);
      default:
        return joinUrl(baseUrl, path);
    }
  }

  buildVersionedHeaders(
    headers: Record<string, string>,
    endpointName: string,
    requestVersion?: ApiVersion | null
  ): Record<string, string> {
    const versionConfig = this.endpointVersions.get(endpointName);
    if (!versionConfig) return headers;

    const version = requestVersion || versionConfig.defaultVersion;
    if (!version) return headers;

    const newHeaders = { ...headers };

    switch (versionConfig.strategy) {
      case 'header':
        newHeaders[versionConfig.headerName || 'API-Version'] = version;
        break;
      case 'accept-header':
        const mediaType = versionConfig.mediaType || 'application/vnd.api';
        newHeaders['Accept'] = `${mediaType}.${version}+json`;
        break;
    }

    return newHeaders;
  }

  buildVersionedParams(
    params: Record<string, unknown>,
    endpointName: string,
    requestVersion?: ApiVersion | null
  ): Record<string, unknown> {
    const versionConfig = this.endpointVersions.get(endpointName);
    if (!versionConfig || versionConfig.strategy !== 'query') return params;

    const version = requestVersion || versionConfig.defaultVersion;
    if (!version) return params;

    return {
      ...params,
      [versionConfig.queryParamName || 'version']: version,
    };
  }

  isVersionSupported(endpointName: string, version: ApiVersion): boolean {
    const versionConfig = this.endpointVersions.get(endpointName);
    if (!versionConfig) return false;

    if (!versionConfig.supportedVersions) return true; // No restrictions
    return versionConfig.supportedVersions.includes(version);
  }

  getSupportedVersions(endpointName: string): ApiVersion[] | undefined {
    const versionConfig = this.endpointVersions.get(endpointName);
    return versionConfig?.supportedVersions;
  }

  getDefaultVersion(endpointName: string): ApiVersion | undefined {
    const versionConfig = this.endpointVersions.get(endpointName);
    return versionConfig?.defaultVersion;
  }

  getVersioningStrategy(endpointName: string): VersioningStrategy | undefined {
    const versionConfig = this.endpointVersions.get(endpointName);
    return versionConfig?.strategy;
  }

  removeEndpointVersion(endpointName: string): void {
    this.endpointVersions.delete(endpointName);
  }

  clear(): void {
    this.endpointVersions.clear();
  }

  getConfiguredEndpoints(): string[] {
    return Array.from(this.endpointVersions.keys());
  }
}

export default VersionManager;
