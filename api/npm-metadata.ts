import { VercelRequest, VercelResponse } from '@vercel/node';
import ky from 'ky';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    const packageName = req.query.packageName;

    try {
        const [
            registryPackageResponse,
            registryDefinitivelyTypedResponse,
        ] = await Promise.all([
            ky.get(`https://registry.npmjs.org/${packageName}`).json() as Promise<{
                'dist-tags': {
                    latest?: string;
                };
                versions: Record<string, {
                    name: string;
                    version: string;
                    description?: string;
                    time?: Record<string, string>;
                }>;
            }>,
            ky.head(`https://registry.npmjs.org/@types/${packageName}`, {
                throwHttpErrors: false,
            }),
        ]);

        const npmRegistryData = registryPackageResponse;
        const definitivelyTyped = registryDefinitivelyTypedResponse.status === 200;

        const latestVersionName = npmRegistryData['dist-tags']?.latest;
        const latestVersionData = latestVersionName ? npmRegistryData.versions[latestVersionName] : null;

        res.setHeader('Cache-Control', 'public, max-age=0, stale-while-revalidate=3600');

        res.send({
            definitivelyTyped,
            hasTypings:
                latestVersionData && ('types' in latestVersionData || 'typings' in latestVersionData),
            latestVersion: latestVersionName,
            description: latestVersionData?.description,
            releaseDatesByVersion: latestVersionData?.time,
        });
    } catch (exception) {
        console.error(exception);
        res.status(500).send((exception as any)?.response?.data ?? 'Unknown error');
    }
}